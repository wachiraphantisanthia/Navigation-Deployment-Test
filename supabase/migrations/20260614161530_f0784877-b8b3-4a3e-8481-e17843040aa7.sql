CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'content_manager');
CREATE TYPE public.node_kind AS ENUM ('walkway', 'store', 'kiosk', 'elevator', 'escalator', 'stairs', 'entrance', 'facility');
CREATE TYPE public.edge_kind AS ENUM ('walkway', 'elevator', 'escalator', 'stairs');
CREATE TYPE public.kiosk_status AS ENUM ('active', 'maintenance', 'offline');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 120),
  avatar_url TEXT,
  locale TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('th','en','cn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users create own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_admin_or_editor(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'super_admin') OR public.has_role(_user_id, 'admin') OR public.has_role(_user_id, 'content_manager')
$$;
GRANT EXECUTE ON FUNCTION public.is_admin_or_editor(UUID) TO authenticated, service_role;

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL CHECK (char_length(name_en) BETWEEN 1 AND 100),
  name_th TEXT NOT NULL CHECK (char_length(name_th) BETWEEN 1 AND 100),
  name_cn TEXT NOT NULL CHECK (char_length(name_cn) BETWEEN 1 AND 100),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{1,80}$'),
  icon TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active categories" ON public.categories FOR SELECT TO anon, authenticated USING (is_active OR public.is_admin_or_editor(auth.uid()));
CREATE POLICY "Editors manage categories" ON public.categories FOR ALL TO authenticated USING (public.is_admin_or_editor(auth.uid())) WITH CHECK (public.is_admin_or_editor(auth.uid()));

CREATE TABLE public.floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  code TEXT NOT NULL UNIQUE CHECK (char_length(code) BETWEEN 1 AND 20),
  level INTEGER NOT NULL UNIQUE,
  map_image_url TEXT,
  map_width NUMERIC NOT NULL DEFAULT 1080 CHECK (map_width > 0),
  map_height NUMERIC NOT NULL DEFAULT 1440 CHECK (map_height > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.floors TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.floors TO authenticated;
GRANT ALL ON public.floors TO service_role;
ALTER TABLE public.floors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active floors" ON public.floors FOR SELECT TO anon, authenticated USING (is_active OR public.is_admin_or_editor(auth.uid()));
CREATE POLICY "Editors manage floors" ON public.floors FOR ALL TO authenticated USING (public.is_admin_or_editor(auth.uid())) WITH CHECK (public.is_admin_or_editor(auth.uid()));

CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 160),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{1,120}$'),
  description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 2000),
  floor_id UUID NOT NULL REFERENCES public.floors(id) ON DELETE RESTRICT,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  logo_url TEXT,
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  opening_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  contact JSONB NOT NULL DEFAULT '{}'::jsonb,
  x NUMERIC NOT NULL CHECK (x >= 0),
  y NUMERIC NOT NULL CHECK (y >= 0),
  destination_node_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stores TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active stores" ON public.stores FOR SELECT TO anon, authenticated USING (is_active OR public.is_admin_or_editor(auth.uid()));
CREATE POLICY "Editors manage stores" ON public.stores FOR ALL TO authenticated USING (public.is_admin_or_editor(auth.uid())) WITH CHECK (public.is_admin_or_editor(auth.uid()));

CREATE TABLE public.navigation_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id UUID NOT NULL REFERENCES public.floors(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT '' CHECK (char_length(label) <= 120),
  x NUMERIC NOT NULL CHECK (x >= 0),
  y NUMERIC NOT NULL CHECK (y >= 0),
  kind public.node_kind NOT NULL DEFAULT 'walkway',
  connector_group TEXT,
  is_accessible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.navigation_nodes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.navigation_nodes TO authenticated;
GRANT ALL ON public.navigation_nodes TO service_role;
ALTER TABLE public.navigation_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view navigation nodes" ON public.navigation_nodes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Editors manage navigation nodes" ON public.navigation_nodes FOR ALL TO authenticated USING (public.is_admin_or_editor(auth.uid())) WITH CHECK (public.is_admin_or_editor(auth.uid()));

ALTER TABLE public.stores ADD CONSTRAINT stores_destination_node_fk FOREIGN KEY (destination_node_id) REFERENCES public.navigation_nodes(id) ON DELETE SET NULL;

CREATE TABLE public.navigation_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_id UUID NOT NULL REFERENCES public.navigation_nodes(id) ON DELETE CASCADE,
  to_node_id UUID NOT NULL REFERENCES public.navigation_nodes(id) ON DELETE CASCADE,
  distance NUMERIC NOT NULL CHECK (distance > 0),
  kind public.edge_kind NOT NULL DEFAULT 'walkway',
  is_bidirectional BOOLEAN NOT NULL DEFAULT true,
  is_accessible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (from_node_id <> to_node_id),
  UNIQUE (from_node_id, to_node_id)
);
GRANT SELECT ON public.navigation_edges TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.navigation_edges TO authenticated;
GRANT ALL ON public.navigation_edges TO service_role;
ALTER TABLE public.navigation_edges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view navigation edges" ON public.navigation_edges FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Editors manage navigation edges" ON public.navigation_edges FOR ALL TO authenticated USING (public.is_admin_or_editor(auth.uid())) WITH CHECK (public.is_admin_or_editor(auth.uid()));

CREATE TABLE public.kiosks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE CHECK (code ~ '^KIOSK-[A-Z0-9-]{2,30}$'),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  floor_id UUID NOT NULL REFERENCES public.floors(id) ON DELETE RESTRICT,
  node_id UUID NOT NULL REFERENCES public.navigation_nodes(id) ON DELETE RESTRICT,
  status public.kiosk_status NOT NULL DEFAULT 'active',
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.kiosks TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.kiosks TO authenticated;
GRANT ALL ON public.kiosks TO service_role;
ALTER TABLE public.kiosks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active kiosks" ON public.kiosks FOR SELECT TO anon, authenticated USING (status = 'active' OR public.is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins manage kiosks" ON public.kiosks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.navigation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_token TEXT NOT NULL UNIQUE CHECK (public_token ~ '^[A-Za-z0-9_-]{16,64}$'),
  kiosk_id UUID REFERENCES public.kiosks(id) ON DELETE SET NULL,
  destination_store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  route_node_ids UUID[] NOT NULL,
  instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_distance NUMERIC NOT NULL CHECK (total_distance >= 0),
  accessible BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.navigation_sessions TO service_role;
ALTER TABLE public.navigation_sessions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.validate_navigation_session_expiry()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.expires_at <= NEW.created_at OR NEW.expires_at > NEW.created_at + interval '30 minutes' THEN
    RAISE EXCEPTION 'Navigation session expiry must be within 30 minutes';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_navigation_session_expiry BEFORE INSERT OR UPDATE ON public.navigation_sessions FOR EACH ROW EXECUTE FUNCTION public.validate_navigation_session_expiry();

CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type ~ '^[a-z_]{2,60}$'),
  kiosk_id UUID REFERENCES public.kiosks(id) ON DELETE SET NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.navigation_sessions(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view analytics" ON public.analytics_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 1200),
  image_url TEXT,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
GRANT SELECT ON public.promotions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.promotions TO authenticated;
GRANT ALL ON public.promotions TO service_role;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view current promotions" ON public.promotions FOR SELECT TO anon, authenticated USING ((is_active AND now() BETWEEN starts_at AND ends_at) OR public.is_admin_or_editor(auth.uid()));
CREATE POLICY "Editors manage promotions" ON public.promotions FOR ALL TO authenticated USING (public.is_admin_or_editor(auth.uid())) WITH CHECK (public.is_admin_or_editor(auth.uid()));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER floors_updated_at BEFORE UPDATE ON public.floors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER nodes_updated_at BEFORE UPDATE ON public.navigation_nodes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER edges_updated_at BEFORE UPDATE ON public.navigation_edges FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER kiosks_updated_at BEFORE UPDATE ON public.kiosks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER promotions_updated_at BEFORE UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX stores_category_idx ON public.stores(category_id) WHERE is_active;
CREATE INDEX stores_floor_idx ON public.stores(floor_id) WHERE is_active;
CREATE INDEX nodes_floor_idx ON public.navigation_nodes(floor_id);
CREATE INDEX edges_from_idx ON public.navigation_edges(from_node_id);
CREATE INDEX edges_to_idx ON public.navigation_edges(to_node_id);
CREATE INDEX sessions_token_expiry_idx ON public.navigation_sessions(public_token, expires_at);
CREATE INDEX analytics_type_time_idx ON public.analytics_events(event_type, occurred_at DESC);
CREATE INDEX analytics_store_idx ON public.analytics_events(store_id, occurred_at DESC);
CREATE INDEX analytics_kiosk_idx ON public.analytics_events(kiosk_id, occurred_at DESC);