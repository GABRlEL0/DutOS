import { format, addDays, isWeekend, differenceInWeeks, startOfWeek, endOfWeek } from 'date-fns';
import type { Post, Client } from '../types/index';
import { normalizeDateOnlyToLocalNoon } from './dateOnly';

// Días hábiles: Lunes a Viernes
export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date);
}

// Obtener el siguiente día hábil
export function getNextBusinessDay(date: Date): Date {
  let nextDay = addDays(date, 1);
  while (!isBusinessDay(nextDay)) {
    nextDay = addDays(nextDay, 1);
  }
  return nextDay;
}

// Formatear fecha para clave de map
export function formatDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

// Calcular el límite diario basado en capacidad semanal
export function getDailyLimit(weeklyCapacity: number): number {
  return Math.ceil(weeklyCapacity / 5);
}

// Interface para el resultado del cálculo de slots
export interface CalculatedSlot {
  post: Post;
  visualDate: Date;
  isOverloaded: boolean;
  weekNumber: number;
}

// Calcular fechas visuales para todos los posts de un cliente
export function calculateVisualDates(
  posts: Post[],
  client: Client,
  startFrom: Date = new Date()
): CalculatedSlot[] {
  const dailyLimit = getDailyLimit(client.weekly_capacity);
  const slotsPerDay: Map<string, number> = new Map();
  const results: CalculatedSlot[] = [];
  
  // Ordenar posts: primero los Pinned por fecha, luego los Flow por prioridad
  const sortedPosts = [...posts].sort((a, b) => {
    // Pinned primero
    if (a.type === 'pinned' && b.type !== 'pinned') return -1;
    if (a.type !== 'pinned' && b.type === 'pinned') return 1;
    
    // Si ambos son Pinned, ordenar por fecha
    if (a.type === 'pinned' && b.type === 'pinned') {
      const dateA = a.pinned_date ? new Date(a.pinned_date).getTime() : 0;
      const dateB = b.pinned_date ? new Date(b.pinned_date).getTime() : 0;
      return dateA - dateB;
    }
    
    // Si ambos son Flow, ordenar por prioridad
    return a.priority_index - b.priority_index;
  });

  for (const post of sortedPosts) {
    let visualDate: Date;
    let isOverloaded = false;

    if (post.type === 'pinned' && post.pinned_date) {
      // Posts Pinned usan su fecha fija
      visualDate = normalizeDateOnlyToLocalNoon(new Date(post.pinned_date));
      
      // Verificar si causa sobrecarga
      const dateKey = formatDateKey(visualDate);
      const currentSlots = slotsPerDay.get(dateKey) || 0;
      if (currentSlots >= dailyLimit) {
        isOverloaded = true;
      }
      slotsPerDay.set(dateKey, currentSlots + 1);
    } else {
      // Posts Flow buscan el próximo slot disponible
      visualDate = findNextAvailableSlot(
        startFrom,
        slotsPerDay,
        dailyLimit
      );
      
      const dateKey = formatDateKey(visualDate);
      const currentSlots = slotsPerDay.get(dateKey) || 0;
      slotsPerDay.set(dateKey, currentSlots + 1);
      
      // Marcar como sobrecarga si excede el límite
      if (currentSlots >= dailyLimit) {
        isOverloaded = true;
      }
    }

    // Calcular número de semana (desde la fecha de inicio)
    const weekNumber = differenceInWeeks(visualDate, startFrom) + 1;

    results.push({
      post,
      visualDate,
      isOverloaded,
      weekNumber,
    });
  }

  return results;
}

// Encontrar el próximo slot disponible
function findNextAvailableSlot(
  startFrom: Date,
  slotsPerDay: Map<string, number>,
  dailyLimit: number
): Date {
  let currentDate = getNextBusinessDay(startFrom);
  
  while (true) {
    const dateKey = formatDateKey(currentDate);
    const occupiedSlots = slotsPerDay.get(dateKey) || 0;
    
    // Si hay espacio disponible, usar este día
    if (occupiedSlots < dailyLimit) {
      return currentDate;
    }
    
    // Si no hay espacio, avanzar al siguiente día hábil
    currentDate = getNextBusinessDay(currentDate);
    
    // Safety check: evitar loop infinito
    if (occupiedSlots > dailyLimit * 10) {
      console.warn('Demasiados posts en un día, posible error en el cálculo');
      return currentDate;
    }
  }
}

// Detectar contenido estancado (stale)
// Una tarea es stale si se desplaza +4 semanas desde su creación
export function isStaleContent(post: Post, visualDate: Date): boolean {
  if (post.type !== 'flow') return false;
  
  const createdDate = new Date(post.createdAt);
  const weeksDiff = differenceInWeeks(visualDate, createdDate);
  
  return weeksDiff > 4;
}

// Verificar conflictos de anclaje
// Retorna true si un día tiene todos los slots ocupados por posts Pinned
export function hasPinnedConflict(
  date: Date,
  posts: Post[],
  weeklyCapacity: number
): boolean {
  const dailyLimit = getDailyLimit(weeklyCapacity);
  const dateKey = formatDateKey(date);
  
  const pinnedPostsOnDate = posts.filter(
    (post) =>
      post.type === 'pinned' &&
      post.pinned_date &&
      formatDateKey(normalizeDateOnlyToLocalNoon(new Date(post.pinned_date))) === dateKey
  );
  
  return pinnedPostsOnDate.length >= dailyLimit;
}

// Agrupar posts por semana
export interface WeekGroup {
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  posts: CalculatedSlot[];
  totalSlots: number;
  isOverloaded: boolean;
}

export function groupByWeek(slots: CalculatedSlot[]): WeekGroup[] {
  const weekMap = new Map<number, WeekGroup>();
  
  for (const slot of slots) {
    const weekNum = slot.weekNumber;
    
    if (!weekMap.has(weekNum)) {
      const weekStart = startOfWeek(slot.visualDate, { weekStartsOn: 1 }); // Lunes
      const weekEnd = endOfWeek(slot.visualDate, { weekStartsOn: 1 }); // Domingo
      
      weekMap.set(weekNum, {
        weekNumber: weekNum,
        weekStart,
        weekEnd,
        posts: [],
        totalSlots: 0,
        isOverloaded: false,
      });
    }
    
    const week = weekMap.get(weekNum)!;
    week.posts.push(slot);
    week.totalSlots++;
    if (slot.isOverloaded) {
      week.isOverloaded = true;
    }
  }
  
  return Array.from(weekMap.values()).sort((a, b) => a.weekNumber - b.weekNumber);
}

// Formatear rango de fecha de semana
export function formatWeekRange(start: Date, end: Date): string {
  return `${format(start, 'dd MMM')} - ${format(end, 'dd MMM yyyy')}`;
}
