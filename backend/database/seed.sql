-- Seed data, taken from the original static site.
-- Run after schema.sql:  mysql -u root -p aro_alumni < backend/database/seed.sql
--
-- Demo accounts - delete these before going live. Log in with email + OTP
-- (with 'debug' => true in config.php the code is shown on screen):
--   alumni@demo.lk          Alumni Login (verified)
--   pending@demo.lk         Alumni Login is refused: still pending verification
-- Students need no seed: any @pdn.ac.lk / @<faculty>.pdn.ac.lk email can use Student Login.

USE aro_alumni;

INSERT INTO faculties (slug, name, image, sort_order) VALUES
  ('engineering',   'Faculty of Engineering',                          'images/faculties/engineering.jpg',   1),
  ('arts',          'Faculty of Arts',                                 'images/faculties/arts.jpg',          2),
  ('science',       'Faculty of Science',                              'images/faculties/science.jpg',       3),
  ('medicine',      'Faculty of Medicine',                             'images/faculties/medicine.jpg',      4),
  ('agriculture',   'Faculty of Agriculture',                          'images/faculties/agriculture.jpg',   5),
  ('management',    'Faculty of Management',                           'images/faculties/management.jpg',    6),
  ('veterinary',    'Faculty of Veterinary Medicine & Animal Science', 'images/faculties/veterinary.jpg',    7),
  ('dental',        'Faculty of Dental Sciences',                      'images/faculties/dental.jpg',        8),
  ('allied-health', 'Faculty of Allied Health Sciences',               'images/faculties/allied-health.jpg', 9);

INSERT INTO events (title, category, banner_text, theme, event_date, location, description) VALUES
  ('Annual Alumni Open Day 2026 at Wala', 'Open Day', 'OPEN DAY 2026', 'maroon', '2026-12-15',
   'Wala, University of Peradeniya',
   'Welcoming all alumni back to campus. Drama at Wala, Tea Gathering, Campus Tour, Networking. Come back to your memories.'),
  ('Alumni Get Together - New York Chapter', 'Get Together', 'GET TOGETHER', 'blue', '2026-11-20',
   'New York, USA',
   'Welcoming alumni for networking dinner. Share experiences and support students.'),
  ('Engineering Faculty Alumni Meetup', 'Faculty Meetup', 'FACULTY MEETUP', 'green', '2027-01-10',
   'Faculty of Engineering',
   'Welcoming alumni for technical talk and networking with students.'),
  ('Scholarship Award Ceremony 2026', 'Ceremony', 'AWARD CEREMONY', 'orange', '2027-02-05',
   'Senate Building',
   'Welcoming donors and students for award ceremony.');

INSERT INTO projects (title, description, status, progress, theme, sort_order) VALUES
  ('Alumni-Funded Scholarship Program 2026', '50 scholarships for needy students',            'ongoing',   70,   'green',  1),
  ('Research Lab Upgrade - Engineering',     'New computers, 3D printers for workshop',       'ongoing',   45,   'blue',   2),
  ('Library Digitalization Project',         'Digitizing old books and thesis',               'ongoing',   NULL, 'purple', 3),
  ('Wala Restoration Project',               'Restoring historic Wala area',                  'ongoing',   NULL, 'orange', 4),
  ('COVID-19 Student Relief Fund',           'Distributed food packs and laptops to 200 students', 'completed', NULL, 'green', 5),
  ('Engineering Workshop Equipment 2023',    'Donated CNC machine and welding equipment',     'completed', NULL, 'green',  6),
  ('Medical Faculty Scholarship 2024',       '30 medical students received support',         'completed', NULL, 'green',  7);

-- Placeholder names: replace with the real patrons and add their photos to frontend/public/images/people/.
INSERT INTO people (group_key, name, designation, photo, sort_order) VALUES
  ('leadership',          'Name of Vice-Chancellor',            'Vice-Chancellor',              NULL, 1),
  ('overseas_advisory',   'Name of Member',                     'Designation',                  NULL, 1),
  ('overseas_advisory',   'Name of Member',                     'Designation',                  NULL, 2),
  ('overseas_advisory',   'Name of Member',                     'Designation',                  NULL, 3),
  ('overseas_advisory',   'Name of Member',                     'Designation',                  NULL, 4),
  ('overseas_advisory',   'Name of Member',                     'Designation',                  NULL, 5),
  ('overseas_advisory',   'Name of Member',                     'Designation',                  NULL, 6),
  ('university_advisory', 'Name of Representative',             'Designation',                  NULL, 1),
  ('university_advisory', 'Name of Representative',             'Designation',                  NULL, 2),
  ('aro',                 'Name of Alumni Relations Officer',   'Alumni Relations Officer',     NULL, 1);

INSERT INTO users (role, email, full_name, preferred_name, phone, faculty_id, grad_year, reg_no,
                   directory_consent, current_country, profession_org, contact_by, contribute, verification_status) VALUES
  ('alumni', 'alumni@demo.lk', 'Kasun Sampath Perera', 'Kasun', '+94 77 000 0000',
   (SELECT id FROM faculties WHERE slug = 'engineering'), 2016, 'E/12/123',
   1, 'Sri Lanka', 'Software Engineer at Virtusa, Colombo',
   'students_mentoring,other_alumni', 'mentoring,guest_lecture', 'verified'),
  ('alumni', 'pending@demo.lk', 'Nimal Jayasinghe', 'Nimal', '+94 71 000 0000',
   (SELECT id FROM faculties WHERE slug = 'arts'), 2008, NULL,
   1, 'Australia', 'Lecturer', 'other_alumni', 'networking', 'pending');
