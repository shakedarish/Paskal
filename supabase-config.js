// Supabase Configuration
// Replace these with your actual Supabase project credentials

const SUPABASE_URL = 'https://xtwcazepyinscfaucvft.supabase.co';  // Example: https://abcdefgh.supabase.co
const SUPABASE_ANON_KEY = 'sb_publishable_nbxFcEmb7VCIMqExJoEVWw_K6xCaidZ';  // Your public anon key

// Initialize Supabase client (make it global)
const { createClient } = supabase;
window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function to check if user is authenticated
async function requireAuth() {
    const { data: { session } } = await window.supabase.auth.getSession();
    
    if (!session) {
        // Not logged in - redirect to login
        window.location.href = '/login.html';
        return null;
    }
    
    return session.user;
}

// Helper function to check user role
async function requireRole(allowedRoles) {
    const user = await requireAuth();
    if (!user) return null;
    
    const { data: profile, error } = await window.supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    
    if (error || !profile) {
        alert('Error loading user profile');
        window.location.href = '/login.html';
        return null;
    }
    
    if (!allowedRoles.includes(profile.role)) {
        alert('Access denied. You do not have permission to view this page.');
        window.location.href = '/login.html';
        return null;
    }
    
    return { user, profile };
}

// Helper function to logout
async function logout() {
    const { error } = await window.supabase.auth.signOut();
    if (error) {
        console.error('Logout error:', error);
    }
    window.location.href = '/login.html';
}

// Helper function to get current user
async function getCurrentUser() {
    const { data: { session } } = await window.supabase.auth.getSession();
    return session?.user || null;
}

// Helper function to get current user profile
async function getCurrentProfile() {
    const user = await getCurrentUser();
    if (!user) return null;
    
    const { data: profile, error } = await window.supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    
    return profile;
}

// Auto-assign sales manager based on country
async function assignSalesManager(customerId, country) {
    try {
        // Find sales manager responsible for this country
        const { data: salesManager, error: smError } = await window.supabase
            .from('sales_managers')
            .select('user_id')
            .contains('countries', [country])
            .single();
        
        if (smError || !salesManager) {
            console.warn('No sales manager found for country:', country);
            return null;
        }
        
        // Update customer profile with assigned sales manager
        const { error: updateError } = await window.supabase
            .from('profiles')
            .update({ assigned_sales_manager: salesManager.user_id })
            .eq('id', customerId);
        
        if (updateError) {
            console.error('Error assigning sales manager:', updateError);
            return null;
        }
        
        return salesManager.user_id;
    } catch (error) {
        console.error('Error in assignSalesManager:', error);
        return null;
    }
}

console.log('Supabase config loaded successfully');
