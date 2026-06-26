-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_shop ENABLE ROW LEVEL SECURITY;
ALTER TABLE scratch_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_feedback ENABLE ROW LEVEL SECURITY;

-- users policies
CREATE POLICY "select_own" ON users FOR SELECT USING (auth.uid() = id);
-- allow insert from server / anon for sign up logic? (The TRD says auth.uid() = id, which implies they only read their own profile. We'll leave inserts to service role or allow self-insert.)
-- Actually, inserting to users often happens via database triggers on auth.users creation. I'll add a trigger.

-- shops policies
CREATE POLICY "select_all" ON shops FOR SELECT USING (true);
CREATE POLICY "modify_own" ON shops FOR ALL USING (auth.uid() = owner_id);

-- customer_shop policies
CREATE POLICY "select_own_or_owner" ON customer_shop FOR SELECT USING (
  auth.uid() = customer_id OR auth.uid() = (SELECT owner_id FROM shops WHERE id = shop_id)
);

-- scratch_cards policies
CREATE POLICY "select_own_or_owner" ON scratch_cards FOR SELECT USING (
  auth.uid() = customer_id OR auth.uid() = (SELECT owner_id FROM shops WHERE id = shop_id)
);

-- private_feedback policies
CREATE POLICY "insert_own" ON private_feedback FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "select_owner_only" ON private_feedback FOR SELECT USING (
  auth.uid() = (SELECT owner_id FROM shops WHERE id = shop_id)
);

-- Trigger to automatically create a users row upon Supabase Auth sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, mobile, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'User'),
    new.phone,
    COALESCE(new.raw_user_meta_data->>'role', 'customer')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
