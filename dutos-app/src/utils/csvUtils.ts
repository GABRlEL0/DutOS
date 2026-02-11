import type { Post, PostType, PostStatus, Client } from '../types/index';
import { dateOnlyFromInput } from './dateOnly';

// CSV field mapping for posts
const POST_CSV_HEADERS = [
    'client_name',
    'type',
    'pillar',
    'script',
    'caption',
    'asset_link',
    'status',
    'pinned_date'
];

// Parse CSV string to array of rows
export function parseCSV(csv: string): string[][] {
    const lines = csv.trim().split('\n');
    return lines.map(line => {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());

        return values;
    });
}

// Convert array to CSV string
export function toCSV(rows: string[][]): string {
    return rows.map(row =>
        row.map(cell => {
            // Escape quotes and wrap in quotes if contains comma or newline
            const escaped = String(cell).replace(/"/g, '""');
            if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
                return `"${escaped}"`;
            }
            return escaped;
        }).join(',')
    ).join('\n');
}

// Export posts to CSV
export function exportPostsToCSV(posts: Post[], clients: Client[]): string {
    const clientMap = new Map(clients.map(c => [c.id, c.name]));

    const rows: string[][] = [POST_CSV_HEADERS];

    posts.forEach(post => {
        rows.push([
            clientMap.get(post.client_id) || 'Unknown',
            post.type,
            post.pillar,
            post.content.script,
            post.content.caption,
            post.content.asset_link || '',
            post.status,
            post.pinned_date ? new Date(post.pinned_date).toISOString().split('T')[0] : ''
        ]);
    });

    return toCSV(rows);
}

// Parse imported CSV to post data
interface ImportedPost {
    client_name: string;
    type: PostType;
    pillar: string;
    script: string;
    caption: string;
    asset_link: string;
    status: PostStatus;
    pinned_date: Date | null;
}

interface ImportResult {
    valid: ImportedPost[];
    errors: { row: number; message: string }[];
}

export function parsePostsFromCSV(csv: string, clients: Client[]): ImportResult {
    const rows = parseCSV(csv);
    const clientNameMap = new Map(clients.map(c => [c.name.toLowerCase(), c]));

    const result: ImportResult = {
        valid: [],
        errors: []
    };

    // Skip header row
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 1;

        if (row.length < 5 || row.every(cell => !cell.trim())) {
            continue; // Skip empty rows
        }

        const [clientName, type, pillar, script, caption, assetLink, status, pinnedDate] = row;

        // Validate client
        const client = clientNameMap.get((clientName || '').toLowerCase());
        if (!client) {
            result.errors.push({ row: rowNum, message: `Cliente "${clientName}" no encontrado` });
            continue;
        }

        // Validate type
        if (type !== 'flow' && type !== 'pinned') {
            result.errors.push({ row: rowNum, message: `Tipo "${type}" inválido (usar: flow, pinned)` });
            continue;
        }

        // Validate content
        if (!script?.trim() && !caption?.trim()) {
            result.errors.push({ row: rowNum, message: 'Debe tener script o caption' });
            continue;
        }

        // Validate pillar
        if (!client.strategy_pillars.includes(pillar)) {
            result.errors.push({ row: rowNum, message: `Pilar "${pillar}" no existe para ${client.name}` });
            continue;
        }

        // Parse pinned date
        let parsedPinnedDate: Date | null = null;
        if (type === 'pinned' && pinnedDate) {
            const date = dateOnlyFromInput(pinnedDate);
            if (isNaN(date.getTime())) {
                result.errors.push({ row: rowNum, message: `Fecha "${pinnedDate}" inválida` });
                continue;
            }
            parsedPinnedDate = date;
        }

        // Validate status (default to draft)
        const validStatuses: PostStatus[] = ['draft', 'pending_approval', 'rejected', 'approved', 'finished', 'published'];
        const finalStatus: PostStatus = validStatuses.includes(status as PostStatus)
            ? (status as PostStatus)
            : 'draft';

        result.valid.push({
            client_name: clientName,
            type: type as PostType,
            pillar,
            script: script || '',
            caption: caption || '',
            asset_link: assetLink || '',
            status: finalStatus,
            pinned_date: parsedPinnedDate
        });
    }

    return result;
}

// Download helper
export function downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

// Generate template CSV
export function generateTemplateCSV(clients: Client[]): string {
    const headers = POST_CSV_HEADERS;
    const exampleRows: string[][] = [headers];

    // Add example row for each client with their pillars
    clients.forEach(client => {
        if (client.strategy_pillars.length > 0) {
            exampleRows.push([
                client.name,
                'flow',
                client.strategy_pillars[0],
                'Ejemplo de script para el video',
                'Caption para redes sociales #hashtag',
                'https://drive.google.com/file/d/...',
                'draft',
                ''
            ]);
        }
    });

    return toCSV(exampleRows);
}
