-- Create users table (extends auth.users)
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  name text NOT NULL,
  mobile text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'customer',
  created_at timestamptz DEFAULT now()
);

-- Create shops table
CREATE TABLE shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  address text,
  opening_hours text,
  instagram text,
  whatsapp text,
  website text,
  qr_code_id text UNIQUE NOT NULL,
  visits_required int DEFAULT 5,
  created_at timestamptz DEFAULT now()
);

-- Create customer_shop table
CREATE TABLE customer_shop (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES users(id),
  shop_id uuid NOT NULL REFERENCES shops(id),
  total_visits int DEFAULT 0,
  last_visit_date date,
  streak_count int DEFAULT 0,
  review_submitted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (customer_id, shop_id)
);

-- Create scratch_cards table
CREATE TABLE scratch_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES users(id),
  shop_id uuid NOT NULL REFERENCES shops(id),
  reward_text text NOT NULL,
  redemption_code text UNIQUE NOT NULL,
  is_revealed boolean DEFAULT false,
  is_redeemed boolean DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create private_feedback table
CREATE TABLE private_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES users(id),
  shop_id uuid NOT NULL REFERENCES shops(id),
  star_rating int NOT NULL CHECK (star_rating >= 1 AND star_rating <= 3),
  feedback_text text,
  created_at timestamptz DEFAULT now()
);
