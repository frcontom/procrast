-- Seed data for testing
-- Requires a user to exist in auth.users first

-- Sample habit
INSERT INTO habits (user_id, name, icon, color, month_key, is_primary)
SELECT id, 'Meditar', 'bi-moon', '#A66CFF', to_char(now(), 'YYYY-MM'), true
FROM auth.users LIMIT 1;

INSERT INTO habits (user_id, name, icon, color, month_key, is_primary)
SELECT id, 'Leer', 'bi-book', '#FF6B6B', to_char(now(), 'YYYY-MM'), false
FROM auth.users LIMIT 1;

-- Sample identity statements
INSERT INTO identity_statements (user_id, statement, category, color)
SELECT id, 'Soy disciplinado y constante', 'general', '#A66CFF'
FROM auth.users LIMIT 1;

INSERT INTO identity_statements (user_id, statement, category, color)
SELECT id, 'Cada día construyo mi mejor versión', 'growth', '#4CAF50'
FROM auth.users LIMIT 1;

-- Sample identity roles
INSERT INTO identity_roles (user_id, name, description, icon, color)
SELECT id, 'Escritor', 'Escribo todos los días', 'bi-pencil', '#FF9800'
FROM auth.users LIMIT 1;

-- Initialize gamification
INSERT INTO gamification (user_id, total_xp, level)
SELECT id, 50, 2
FROM auth.users LIMIT 1
ON CONFLICT (user_id) DO NOTHING;

-- Sample coaching message
INSERT INTO coaching_messages (user_id, msg_type, category, title, message)
SELECT id, 'achievement', 'onboarding', '¡Bienvenido a Férreo!',
       'Has dado el primer paso hacia una vida más enfocada y disciplinada.'
FROM auth.users LIMIT 1;
