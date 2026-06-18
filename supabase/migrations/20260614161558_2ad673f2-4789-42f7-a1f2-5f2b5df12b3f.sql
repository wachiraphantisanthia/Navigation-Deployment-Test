ALTER FUNCTION public.has_role(UUID, public.app_role) SECURITY INVOKER;
ALTER FUNCTION public.is_admin_or_editor(UUID) SECURITY INVOKER;
REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin_or_editor(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_or_editor(UUID) TO authenticated, service_role;
CREATE POLICY "Navigation sessions are server managed" ON public.navigation_sessions FOR ALL TO authenticated USING (false) WITH CHECK (false);