export function hasPanelAccess(pathname, role) {
    if (!role) return false;
    if (role === 'manager') return true;

    const base = pathname.replace(/\/$/, '') || '/panel';

    const developerRoutes = [
        '/panel',
        '/panel/profile',
        '/panel/notes',
        '/panel/todos',
        '/panel/chat',
        '/panel/board',
        '/panel/security',
        '/panel/settings',
    ];

    const supportRoutes = [
        '/panel',
        '/panel/profile',
        '/panel/notes',
        '/panel/todos',
        '/panel/chat',
        '/panel/tickets',
        '/panel/projects',
        '/panel/support',
        '/panel/purchases',
        '/panel/payments',
        '/panel/board',
        '/panel/security',
        '/panel/settings',
        '/panel/users',
        '/panel/leads',
        '/panel/leads/clients',
        '/panel/leads/business',
        '/panel/reviews',
    ];

    if (role === 'developer') {
        return developerRoutes.some(r => base === r || base.startsWith(r + '/'));
    }

    if (role === 'support') {
        return supportRoutes.some(r => base === r || base.startsWith(r + '/'));
    }

    return false;
}
