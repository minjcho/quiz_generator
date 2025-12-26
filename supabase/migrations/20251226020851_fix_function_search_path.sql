-- Fix function search path mutable security issue
-- https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;
