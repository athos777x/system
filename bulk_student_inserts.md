-- =========================
-- Grade 7 Students (IDs 2-11)
-- =========================

-- Insert into student
INSERT INTO student (student_id, lrn, lastname, middlename, firstname, current_yr_lvl, birthdate, gender, age, home_address, barangay, city_municipality, province, contact_number, email_address, mother_name, father_name, parent_address, father_occupation, mother_occupation, annual_hshld_income, number_of_siblings, father_educ_lvl, mother_educ_lvl, father_contact_number, mother_contact_number, status, active_status, emergency_number, emergency_contactperson)
VALUES
(2, '133423847240', 'Santos', 'Reyes', 'Maria Clara', '7', '2008-06-12', 'Female', 16, '123 Mabini St', 'Barangay Dos', 'Tagbilaran', 'Bohol', '09171234560', 'mariaclara.santos@lnhs.com', 'Luz Santos', 'Jose Santos', '123 Mabini St', 'Driver', 'Vendor', 50000, 2, 'High School', 'College', '09181234560', '09191234560', 'active', 'unarchive', '09171234561', 'Luz Santos'),
(3, '133423847241', 'Dela Cruz', 'Lopez', 'Juan', '7', '2008-07-15', 'Male', 15, '456 Rizal Ave', 'Barangay Tres', 'Tagbilaran', 'Bohol', '09171234562', 'juan.delacruz@lnhs.com', 'Ana Dela Cruz', 'Pedro Dela Cruz', '456 Rizal Ave', 'Carpenter', 'Housewife', 60000, 3, 'College', 'High School', '09181234562', '09191234562', 'active', 'unarchive', '09171234563', 'Ana Dela Cruz'),
(4, '133423847242', 'Garcia', 'Torres', 'Josefina', '7', '2008-08-20', 'Female', 15, '789 Bonifacio St', 'Barangay Uno', 'Tagbilaran', 'Bohol', '09171234564', 'josefina.garcia@lnhs.com', 'Carmen Garcia', 'Luis Garcia', '789 Bonifacio St', 'Farmer', 'Teacher', 70000, 1, 'College', 'College', '09181234564', '09191234564', 'active', 'unarchive', '09171234565', 'Carmen Garcia'),
(5, '133423847243', 'Reyes', 'Santos', 'Miguel', '7', '2008-09-10', 'Male', 15, '321 Luna St', 'Barangay Quatro', 'Tagbilaran', 'Bohol', '09171234566', 'miguel.reyes@lnhs.com', 'Elena Reyes', 'Carlos Reyes', '321 Luna St', 'Driver', 'Vendor', 80000, 2, 'High School', 'High School', '09181234566', '09191234566', 'active', 'unarchive', '09171234567', 'Elena Reyes'),
(6, '133423847244', 'Mendoza', 'Cruz', 'Andrea', '7', '2008-10-05', 'Female', 15, '654 Aguinaldo St', 'Barangay Cinco', 'Tagbilaran', 'Bohol', '09171234568', 'andrea.mendoza@lnhs.com', 'Rosa Mendoza', 'Juan Mendoza', '654 Aguinaldo St', 'Mechanic', 'Nurse', 90000, 4, 'College', 'College', '09181234568', '09191234568', 'active', 'unarchive', '09171234569', 'Rosa Mendoza'),
(7, '133423847245', 'Torres', 'Garcia', 'Carlos', '7', '2008-11-22', 'Male', 15, '987 Mabini St', 'Barangay Seis', 'Tagbilaran', 'Bohol', '09171234570', 'carlos.torres@lnhs.com', 'Maria Torres', 'Jose Torres', '987 Mabini St', 'Driver', 'Vendor', 100000, 2, 'High School', 'High School', '09181234570', '09191234570', 'active', 'unarchive', '09171234571', 'Maria Torres'),
(8, '133423847246', 'Lopez', 'Dela Cruz', 'Sofia', '7', '2008-12-30', 'Female', 15, '159 Rizal Ave', 'Barangay Siete', 'Tagbilaran', 'Bohol', '09171234572', 'sofia.lopez@lnhs.com', 'Ana Lopez', 'Pedro Lopez', '159 Rizal Ave', 'Carpenter', 'Housewife', 110000, 3, 'College', 'High School', '09181234572', '09191234572', 'active', 'unarchive', '09171234573', 'Ana Lopez'),
(9, '133423847247', 'Cruz', 'Mendoza', 'Gabriel', '7', '2008-01-18', 'Male', 16, '753 Bonifacio St', 'Barangay Ocho', 'Tagbilaran', 'Bohol', '09171234574', 'gabriel.cruz@lnhs.com', 'Carmen Cruz', 'Luis Cruz', '753 Bonifacio St', 'Farmer', 'Teacher', 120000, 1, 'College', 'College', '09181234574', '09191234574', 'active', 'unarchive', '09171234575', 'Carmen Cruz'),
(10, '133423847248', 'Villanueva', 'Reyes', 'Isabella', '7', '2008-02-25', 'Female', 16, '852 Luna St', 'Barangay Nueve', 'Tagbilaran', 'Bohol', '09171234576', 'isabella.villanueva@lnhs.com', 'Elena Villanueva', 'Carlos Villanueva', '852 Luna St', 'Driver', 'Vendor', 130000, 2, 'High School', 'High School', '09181234576', '09191234576', 'active', 'unarchive', '09171234577', 'Elena Villanueva'),
(11, '133423847249', 'Ramos', 'Villanueva', 'Daniel', '7', '2008-03-14', 'Male', 16, '951 Aguinaldo St', 'Barangay Diez', 'Tagbilaran', 'Bohol', '09171234578', 'daniel.ramos@lnhs.com', 'Rosa Ramos', 'Juan Ramos', '951 Aguinaldo St', 'Mechanic', 'Nurse', 140000, 4, 'College', 'College', '09181234578', '09191234578', 'active', 'unarchive', '09171234579', 'Rosa Ramos');

-- Insert into brigada_details
INSERT INTO brigada_details (student_id, remarks, school_year_id, brigada_status) VALUES
(2, '', 1, 'Not Attended'),
(3, '', 1, 'Not Attended'),
(4, '', 1, 'Not Attended'),
(5, '', 1, 'Not Attended'),
(6, '', 1, 'Not Attended'),
(7, '', 1, 'Not Attended'),
(8, '', 1, 'Not Attended'),
(9, '', 1, 'Not Attended'),
(10, '', 1, 'Not Attended'),
(11, '', 1, 'Not Attended');

-- Insert into users
INSERT INTO users (user_id, username, password, role_id, role_name) VALUES
(10, 'santos.maria_clara@lnhs.com', '1234', 2, 'student'),
(11, 'delacruz.juan@lnhs.com', '1234', 2, 'student'),
(12, 'garcia.josefina@lnhs.com', '1234', 2, 'student'),
(13, 'reyes.miguel@lnhs.com', '1234', 2, 'student'),
(14, 'mendoza.andrea@lnhs.com', '1234', 2, 'student'),
(15, 'torres.carlos@lnhs.com', '1234', 2, 'student'),
(16, 'lopez.sofia@lnhs.com', '1234', 2, 'student'),
(17, 'cruz.gabriel@lnhs.com', '1234', 2, 'student'),
(18, 'villanueva.isabella@lnhs.com', '1234', 2, 'student'),
(19, 'ramos.daniel@lnhs.com', '1234', 2, 'student');

-- Insert into enrollment
INSERT INTO enrollment (enrollment_id, student_id, enrollment_date, grade_level, enrollee_type, brigada_id, enrollment_status, student_name, school_year_id)
VALUES
(2, 2, '2025-05-18', '7', 'Regular', 2, 'inactive', 'Maria Clara Reyes Santos', 1),
(3, 3, '2025-05-18', '7', 'Regular', 3, 'inactive', 'Juan Lopez Dela Cruz', 1),
(4, 4, '2025-05-18', '7', 'Regular', 4, 'inactive', 'Josefina Torres Garcia', 1),
(5, 5, '2025-05-18', '7', 'Regular', 5, 'inactive', 'Miguel Santos Reyes', 1),
(6, 6, '2025-05-18', '7', 'Regular', 6, 'inactive', 'Andrea Cruz Mendoza', 1),
(7, 7, '2025-05-18', '7', 'Regular', 7, 'inactive', 'Carlos Garcia Torres', 1),
(8, 8, '2025-05-18', '7', 'Regular', 8, 'inactive', 'Sofia Dela Cruz Lopez', 1),
(9, 9, '2025-05-18', '7', 'Regular', 9, 'inactive', 'Gabriel Mendoza Cruz', 1),
(10, 10, '2025-05-18', '7', 'Regular', 10, 'inactive', 'Isabella Reyes Villanueva', 1),
(11, 11, '2025-05-18', '7', 'Regular', 11, 'inactive', 'Daniel Villanueva Ramos', 1);

-- Insert into student_school_year
INSERT INTO student_school_year (student_id, school_year_id, status, student_name, grade_level) VALUES
(2, 1, 'active', 'Maria Clara Reyes Santos', 7),
(3, 1, 'active', 'Juan Lopez Dela Cruz', 7),
(4, 1, 'active', 'Josefina Torres Garcia', 7),
(5, 1, 'active', 'Miguel Santos Reyes', 7),
(6, 1, 'active', 'Andrea Cruz Mendoza', 7),
(7, 1, 'active', 'Carlos Garcia Torres', 7),
(8, 1, 'active', 'Sofia Dela Cruz Lopez', 7),
(9, 1, 'active', 'Gabriel Mendoza Cruz', 7),
(10, 1, 'active', 'Isabella Reyes Villanueva', 7),
(11, 1, 'active', 'Daniel Villanueva Ramos', 7);

-- =========================
-- Grade 8 Students (IDs 12-21)
-- =========================

-- Insert into student
INSERT INTO student (student_id, lrn, lastname, middlename, firstname, current_yr_lvl, birthdate, gender, age, home_address, barangay, city_municipality, province, contact_number, email_address, mother_name, father_name, parent_address, father_occupation, mother_occupation, annual_hshld_income, number_of_siblings, father_educ_lvl, mother_educ_lvl, father_contact_number, mother_contact_number, status, active_status, emergency_number, emergency_contactperson)
VALUES
(12, '133423847250', 'Morales', 'Santos', 'Angela', '8', '2007-06-12', 'Female', 17, '111 Mabini St', 'Barangay Dos', 'Tagbilaran', 'Bohol', '09171234580', 'angela.morales@lnhs.com', 'Luz Morales', 'Jose Morales', '111 Mabini St', 'Driver', 'Vendor', 50000, 2, 'High School', 'College', '09181234580', '09191234580', 'active', 'unarchive', '09171234581', 'Luz Morales'),
(13, '133423847251', 'Castro', 'Lopez', 'Roberto', '8', '2007-07-15', 'Male', 16, '222 Rizal Ave', 'Barangay Tres', 'Tagbilaran', 'Bohol', '09171234582', 'roberto.castro@lnhs.com', 'Ana Castro', 'Pedro Castro', '222 Rizal Ave', 'Carpenter', 'Housewife', 60000, 3, 'College', 'High School', '09181234582', '09191234582', 'active', 'unarchive', '09171234583', 'Ana Castro'),
(14, '133423847252', 'Navarro', 'Torres', 'Patricia', '8', '2007-08-20', 'Female', 16, '333 Bonifacio St', 'Barangay Uno', 'Tagbilaran', 'Bohol', '09171234584', 'patricia.navarro@lnhs.com', 'Carmen Navarro', 'Luis Navarro', '333 Bonifacio St', 'Farmer', 'Teacher', 70000, 1, 'College', 'College', '09181234584', '09191234584', 'active', 'unarchive', '09171234585', 'Carmen Navarro'),
(15, '133423847253', 'Ramos', 'Santos', 'Enrique', '8', '2007-09-10', 'Male', 16, '444 Luna St', 'Barangay Quatro', 'Tagbilaran', 'Bohol', '09171234586', 'enrique.ramos@lnhs.com', 'Elena Ramos', 'Carlos Ramos', '444 Luna St', 'Driver', 'Vendor', 80000, 2, 'High School', 'High School', '09181234586', '09191234586', 'active', 'unarchive', '09171234587', 'Elena Ramos'),
(16, '133423847254', 'Gutierrez', 'Cruz', 'Monica', '8', '2007-10-05', 'Female', 16, '555 Aguinaldo St', 'Barangay Cinco', 'Tagbilaran', 'Bohol', '09171234588', 'monica.gutierrez@lnhs.com', 'Rosa Gutierrez', 'Juan Gutierrez', '555 Aguinaldo St', 'Mechanic', 'Nurse', 90000, 4, 'College', 'College', '09181234588', '09191234588', 'active', 'unarchive', '09171234589', 'Rosa Gutierrez'),
(17, '133423847255', 'Silva', 'Garcia', 'Francisco', '8', '2007-11-22', 'Male', 16, '666 Mabini St', 'Barangay Seis', 'Tagbilaran', 'Bohol', '09171234590', 'francisco.silva@lnhs.com', 'Maria Silva', 'Jose Silva', '666 Mabini St', 'Driver', 'Vendor', 100000, 2, 'High School', 'High School', '09181234590', '09191234590', 'active', 'unarchive', '09171234591', 'Maria Silva'),
(18, '133423847256', 'Ortiz', 'Dela Cruz', 'Camila', '8', '2007-12-30', 'Female', 16, '777 Rizal Ave', 'Barangay Siete', 'Tagbilaran', 'Bohol', '09171234592', 'camila.ortiz@lnhs.com', 'Ana Ortiz', 'Pedro Ortiz', '777 Rizal Ave', 'Carpenter', 'Housewife', 110000, 3, 'College', 'High School', '09181234592', '09191234592', 'active', 'unarchive', '09171234593', 'Ana Ortiz'),
(19, '133423847257', 'Perez', 'Mendoza', 'Diego', '8', '2007-01-18', 'Male', 17, '888 Bonifacio St', 'Barangay Ocho', 'Tagbilaran', 'Bohol', '09171234594', 'diego.perez@lnhs.com', 'Carmen Perez', 'Luis Perez', '888 Bonifacio St', 'Farmer', 'Teacher', 120000, 1, 'College', 'College', '09181234594', '09191234594', 'active', 'unarchive', '09171234595', 'Carmen Perez'),
(20, '133423847258', 'Flores', 'Reyes', 'Valeria', '8', '2007-02-25', 'Female', 17, '999 Luna St', 'Barangay Nueve', 'Tagbilaran', 'Bohol', '09171234596', 'valeria.flores@lnhs.com', 'Elena Flores', 'Carlos Flores', '999 Luna St', 'Driver', 'Vendor', 130000, 2, 'High School', 'High School', '09181234596', '09191234596', 'active', 'unarchive', '09171234597', 'Elena Flores'),
(21, '133423847259', 'Santiago', 'Villanueva', 'Luis', '8', '2007-03-14', 'Male', 17, '101 Aguinaldo St', 'Barangay Diez', 'Tagbilaran', 'Bohol', '09171234598', 'luis.santiago@lnhs.com', 'Rosa Santiago', 'Juan Santiago', '101 Aguinaldo St', 'Mechanic', 'Nurse', 140000, 4, 'College', 'College', '09181234598', '09191234598', 'active', 'unarchive', '09171234599', 'Rosa Santiago');

-- Insert into brigada_details
INSERT INTO brigada_details (student_id, remarks, school_year_id, brigada_status) VALUES
(12, '', 1, 'Not Attended'),
(13, '', 1, 'Not Attended'),
(14, '', 1, 'Not Attended'),
(15, '', 1, 'Not Attended'),
(16, '', 1, 'Not Attended'),
(17, '', 1, 'Not Attended'),
(18, '', 1, 'Not Attended'),
(19, '', 1, 'Not Attended'),
(20, '', 1, 'Not Attended'),
(21, '', 1, 'Not Attended');

-- Insert into users
INSERT INTO users (user_id, username, password, role_id, role_name) VALUES
(20, 'morales.angela@lnhs.com', '1234', 2, 'student'),
(21, 'castro.roberto@lnhs.com', '1234', 2, 'student'),
(22, 'navarro.patricia@lnhs.com', '1234', 2, 'student'),
(23, 'ramos.enrique@lnhs.com', '1234', 2, 'student'),
(24, 'gutierrez.monica@lnhs.com', '1234', 2, 'student'),
(25, 'silva.francisco@lnhs.com', '1234', 2, 'student'),
(26, 'ortiz.camila@lnhs.com', '1234', 2, 'student'),
(27, 'perez.diego@lnhs.com', '1234', 2, 'student'),
(28, 'flores.valeria@lnhs.com', '1234', 2, 'student'),
(29, 'santiago.luis@lnhs.com', '1234', 2, 'student');

-- Insert into enrollment
INSERT INTO enrollment (enrollment_id, student_id, enrollment_date, grade_level, enrollee_type, brigada_id, enrollment_status, student_name, school_year_id)
VALUES
(12, 12, '2025-05-18', '8', 'Regular', 12, 'inactive', 'Angela Santos Morales', 1),
(13, 13, '2025-05-18', '8', 'Regular', 13, 'inactive', 'Roberto Lopez Castro', 1),
(14, 14, '2025-05-18', '8', 'Regular', 14, 'inactive', 'Patricia Torres Navarro', 1),
(15, 15, '2025-05-18', '8', 'Regular', 15, 'inactive', 'Enrique Santos Ramos', 1),
(16, 16, '2025-05-18', '8', 'Regular', 16, 'inactive', 'Monica Cruz Gutierrez', 1),
(17, 17, '2025-05-18', '8', 'Regular', 17, 'inactive', 'Francisco Garcia Silva', 1),
(18, 18, '2025-05-18', '8', 'Regular', 18, 'inactive', 'Camila Dela Cruz Ortiz', 1),
(19, 19, '2025-05-18', '8', 'Regular', 19, 'inactive', 'Diego Mendoza Perez', 1),
(20, 20, '2025-05-18', '8', 'Regular', 20, 'inactive', 'Valeria Reyes Flores', 1),
(21, 21, '2025-05-18', '8', 'Regular', 21, 'inactive', 'Luis Villanueva Santiago', 1);

-- Insert into student_school_year
INSERT INTO student_school_year (student_id, school_year_id, status, student_name, grade_level) VALUES
(12, 1, 'active', 'Angela Santos Morales', 8),
(13, 1, 'active', 'Roberto Lopez Castro', 8),
(14, 1, 'active', 'Patricia Torres Navarro', 8),
(15, 1, 'active', 'Enrique Santos Ramos', 8),
(16, 1, 'active', 'Monica Cruz Gutierrez', 8),
(17, 1, 'active', 'Francisco Garcia Silva', 8),
(18, 1, 'active', 'Camila Dela Cruz Ortiz', 8),
(19, 1, 'active', 'Diego Mendoza Perez', 8),
(20, 1, 'active', 'Valeria Reyes Flores', 8),
(21, 1, 'active', 'Luis Villanueva Santiago', 8);

-- =========================
-- Grade 9 Students (IDs 22-31)
-- =========================

-- Insert into student
INSERT INTO student (student_id, lrn, lastname, middlename, firstname, current_yr_lvl, birthdate, gender, age, home_address, barangay, city_municipality, province, contact_number, email_address, mother_name, father_name, parent_address, father_occupation, mother_occupation, annual_hshld_income, number_of_siblings, father_educ_lvl, mother_educ_lvl, father_contact_number, mother_contact_number, status, active_status, emergency_number, emergency_contactperson)
VALUES
(22, '133423847260', 'Aguilar', 'Santos', 'Jasmine', '9', '2006-06-12', 'Female', 18, '201 Mabini St', 'Barangay Dos', 'Tagbilaran', 'Bohol', '09171234600', 'jasmine.aguilar@lnhs.com', 'Luz Aguilar', 'Jose Aguilar', '201 Mabini St', 'Driver', 'Vendor', 50000, 2, 'High School', 'College', '09181234600', '09191234600', 'active', 'unarchive', '09171234601', 'Luz Aguilar'),
(23, '133423847261', 'Bautista', 'Lopez', 'Marco', '9', '2006-07-15', 'Male', 17, '202 Rizal Ave', 'Barangay Tres', 'Tagbilaran', 'Bohol', '09171234602', 'marco.bautista@lnhs.com', 'Ana Bautista', 'Pedro Bautista', '202 Rizal Ave', 'Carpenter', 'Housewife', 60000, 3, 'College', 'High School', '09181234602', '09191234602', 'active', 'unarchive', '09171234603', 'Ana Bautista'),
(24, '133423847262', 'Cabrera', 'Torres', 'Nicole', '9', '2006-08-20', 'Female', 17, '203 Bonifacio St', 'Barangay Uno', 'Tagbilaran', 'Bohol', '09171234604', 'nicole.cabrera@lnhs.com', 'Carmen Cabrera', 'Luis Cabrera', '203 Bonifacio St', 'Farmer', 'Teacher', 70000, 1, 'College', 'College', '09181234604', '09191234604', 'active', 'unarchive', '09171234605', 'Carmen Cabrera'),
(25, '133423847263', 'Domingo', 'Santos', 'Rafael', '9', '2006-09-10', 'Male', 17, '204 Luna St', 'Barangay Quatro', 'Tagbilaran', 'Bohol', '09171234606', 'rafael.domingo@lnhs.com', 'Elena Domingo', 'Carlos Domingo', '204 Luna St', 'Driver', 'Vendor', 80000, 2, 'High School', 'High School', '09181234606', '09191234606', 'active', 'unarchive', '09171234607', 'Elena Domingo'),
(26, '133423847264', 'Escobar', 'Cruz', 'Samantha', '9', '2006-10-05', 'Female', 17, '205 Aguinaldo St', 'Barangay Cinco', 'Tagbilaran', 'Bohol', '09171234608', 'samantha.escobar@lnhs.com', 'Rosa Escobar', 'Juan Escobar', '205 Aguinaldo St', 'Mechanic', 'Nurse', 90000, 4, 'College', 'College', '09181234608', '09191234608', 'active', 'unarchive', '09171234609', 'Rosa Escobar'),
(27, '133423847265', 'Fernandez', 'Garcia', 'Victor', '9', '2006-11-22', 'Male', 17, '206 Mabini St', 'Barangay Seis', 'Tagbilaran', 'Bohol', '09171234610', 'victor.fernandez@lnhs.com', 'Maria Fernandez', 'Jose Fernandez', '206 Mabini St', 'Driver', 'Vendor', 100000, 2, 'High School', 'High School', '09181234610', '09191234610', 'active', 'unarchive', '09171234611', 'Maria Fernandez'),
(28, '133423847266', 'Gomez', 'Dela Cruz', 'Bianca', '9', '2006-12-30', 'Female', 17, '207 Rizal Ave', 'Barangay Siete', 'Tagbilaran', 'Bohol', '09171234612', 'bianca.gomez@lnhs.com', 'Ana Gomez', 'Pedro Gomez', '207 Rizal Ave', 'Carpenter', 'Housewife', 110000, 3, 'College', 'High School', '09181234612', '09191234612', 'active', 'unarchive', '09171234613', 'Ana Gomez'),
(29, '133423847267', 'Hernandez', 'Mendoza', 'Miguel', '9', '2006-01-18', 'Male', 18, '208 Bonifacio St', 'Barangay Ocho', 'Tagbilaran', 'Bohol', '09171234614', 'miguel.hernandez@lnhs.com', 'Carmen Hernandez', 'Luis Hernandez', '208 Bonifacio St', 'Farmer', 'Teacher', 120000, 1, 'College', 'College', '09181234614', '09191234614', 'active', 'unarchive', '09171234615', 'Carmen Hernandez'),
(30, '133423847268', 'Ibarra', 'Reyes', 'Sofia', '9', '2006-02-25', 'Female', 18, '209 Luna St', 'Barangay Nueve', 'Tagbilaran', 'Bohol', '09171234616', 'sofia.ibarra@lnhs.com', 'Elena Ibarra', 'Carlos Ibarra', '209 Luna St', 'Driver', 'Vendor', 130000, 2, 'High School', 'High School', '09181234616', '09191234616', 'active', 'unarchive', '09171234617', 'Elena Ibarra'),
(31, '133423847269', 'Jimenez', 'Villanueva', 'Andres', '9', '2006-03-14', 'Male', 18, '210 Aguinaldo St', 'Barangay Diez', 'Tagbilaran', 'Bohol', '09171234618', 'andres.jimenez@lnhs.com', 'Rosa Jimenez', 'Juan Jimenez', '210 Aguinaldo St', 'Mechanic', 'Nurse', 140000, 4, 'College', 'College', '09181234618', '09191234618', 'active', 'unarchive', '09171234619', 'Rosa Jimenez');

-- Insert into brigada_details
INSERT INTO brigada_details (student_id, remarks, school_year_id, brigada_status) VALUES
(22, '', 1, 'Not Attended'),
(23, '', 1, 'Not Attended'),
(24, '', 1, 'Not Attended'),
(25, '', 1, 'Not Attended'),
(26, '', 1, 'Not Attended'),
(27, '', 1, 'Not Attended'),
(28, '', 1, 'Not Attended'),
(29, '', 1, 'Not Attended'),
(30, '', 1, 'Not Attended'),
(31, '', 1, 'Not Attended');

-- Insert into users
INSERT INTO users (user_id, username, password, role_id, role_name) VALUES
(30, 'aguilar.jasmine@lnhs.com', '1234', 2, 'student'),
(31, 'bautista.marco@lnhs.com', '1234', 2, 'student'),
(32, 'cabrera.nicole@lnhs.com', '1234', 2, 'student'),
(33, 'domingo.rafael@lnhs.com', '1234', 2, 'student'),
(34, 'escobar.samantha@lnhs.com', '1234', 2, 'student'),
(35, 'fernandez.victor@lnhs.com', '1234', 2, 'student'),
(36, 'gomez.bianca@lnhs.com', '1234', 2, 'student'),
(37, 'hernandez.miguel@lnhs.com', '1234', 2, 'student'),
(38, 'ibarra.sofia@lnhs.com', '1234', 2, 'student'),
(39, 'jimenez.andres@lnhs.com', '1234', 2, 'student');

-- Insert into enrollment
INSERT INTO enrollment (enrollment_id, student_id, enrollment_date, grade_level, enrollee_type, brigada_id, enrollment_status, student_name, school_year_id)
VALUES
(22, 22, '2025-05-18', '9', 'Regular', 22, 'inactive', 'Jasmine Santos Aguilar', 1),
(23, 23, '2025-05-18', '9', 'Regular', 23, 'inactive', 'Marco Lopez Bautista', 1),
(24, 24, '2025-05-18', '9', 'Regular', 24, 'inactive', 'Nicole Torres Cabrera', 1),
(25, 25, '2025-05-18', '9', 'Regular', 25, 'inactive', 'Rafael Santos Domingo', 1),
(26, 26, '2025-05-18', '9', 'Regular', 26, 'inactive', 'Samantha Cruz Escobar', 1),
(27, 27, '2025-05-18', '9', 'Regular', 27, 'inactive', 'Victor Garcia Fernandez', 1),
(28, 28, '2025-05-18', '9', 'Regular', 28, 'inactive', 'Bianca Dela Cruz Gomez', 1),
(29, 29, '2025-05-18', '9', 'Regular', 29, 'inactive', 'Miguel Mendoza Hernandez', 1),
(30, 30, '2025-05-18', '9', 'Regular', 30, 'inactive', 'Sofia Reyes Ibarra', 1),
(31, 31, '2025-05-18', '9', 'Regular', 31, 'inactive', 'Andres Villanueva Jimenez', 1);

-- Insert into student_school_year
INSERT INTO student_school_year (student_id, school_year_id, status, student_name, grade_level) VALUES
(22, 1, 'active', 'Jasmine Santos Aguilar', 9),
(23, 1, 'active', 'Marco Lopez Bautista', 9),
(24, 1, 'active', 'Nicole Torres Cabrera', 9),
(25, 1, 'active', 'Rafael Santos Domingo', 9),
(26, 1, 'active', 'Samantha Cruz Escobar', 9),
(27, 1, 'active', 'Victor Garcia Fernandez', 9),
(28, 1, 'active', 'Bianca Dela Cruz Gomez', 9),
(29, 1, 'active', 'Miguel Mendoza Hernandez', 9),
(30, 1, 'active', 'Sofia Reyes Ibarra', 9),
(31, 1, 'active', 'Andres Villanueva Jimenez', 9);

-- =========================
-- Grade 10 Students (IDs 32-41)
-- =========================

-- Insert into student
INSERT INTO student (student_id, lrn, lastname, middlename, firstname, current_yr_lvl, birthdate, gender, age, home_address, barangay, city_municipality, province, contact_number, email_address, mother_name, father_name, parent_address, father_occupation, mother_occupation, annual_hshld_income, number_of_siblings, father_educ_lvl, mother_educ_lvl, father_contact_number, mother_contact_number, status, active_status, emergency_number, emergency_contactperson)
VALUES
(32, '133423847270', 'Luna', 'Santos', 'Clarissa', '10', '2005-06-12', 'Female', 19, '301 Mabini St', 'Barangay Dos', 'Tagbilaran', 'Bohol', '09171234620', 'clarissa.luna@lnhs.com', 'Luz Luna', 'Jose Luna', '301 Mabini St', 'Driver', 'Vendor', 50000, 2, 'High School', 'College', '09181234620', '09191234620', 'active', 'unarchive', '09171234621', 'Luz Luna'),
(33, '133423847271', 'Mendoza', 'Lopez', 'Oscar', '10', '2005-07-15', 'Male', 18, '302 Rizal Ave', 'Barangay Tres', 'Tagbilaran', 'Bohol', '09171234622', 'oscar.mendoza@lnhs.com', 'Ana Mendoza', 'Pedro Mendoza', '302 Rizal Ave', 'Carpenter', 'Housewife', 60000, 3, 'College', 'High School', '09181234622', '09191234622', 'active', 'unarchive', '09171234623', 'Ana Mendoza'),
(34, '133423847272', 'Nieves', 'Torres', 'Regina', '10', '2005-08-20', 'Female', 18, '303 Bonifacio St', 'Barangay Uno', 'Tagbilaran', 'Bohol', '09171234624', 'regina.nieves@lnhs.com', 'Carmen Nieves', 'Luis Nieves', '303 Bonifacio St', 'Farmer', 'Teacher', 70000, 1, 'College', 'College', '09181234624', '09191234624', 'active', 'unarchive', '09171234625', 'Carmen Nieves'),
(35, '133423847273', 'Ocampo', 'Santos', 'Samuel', '10', '2005-09-10', 'Male', 18, '304 Luna St', 'Barangay Quatro', 'Tagbilaran', 'Bohol', '09171234626', 'samuel.ocampo@lnhs.com', 'Elena Ocampo', 'Carlos Ocampo', '304 Luna St', 'Driver', 'Vendor', 80000, 2, 'High School', 'High School', '09181234626', '09191234626', 'active', 'unarchive', '09171234627', 'Elena Ocampo'),
(36, '133423847274', 'Pascual', 'Cruz', 'Teresa', '10', '2005-10-05', 'Female', 18, '305 Aguinaldo St', 'Barangay Cinco', 'Tagbilaran', 'Bohol', '09171234628', 'teresa.pascual@lnhs.com', 'Rosa Pascual', 'Juan Pascual', '305 Aguinaldo St', 'Mechanic', 'Nurse', 90000, 4, 'College', 'College', '09181234628', '09191234628', 'active', 'unarchive', '09171234629', 'Rosa Pascual'),
(37, '133423847275', 'Quinto', 'Garcia', 'Tomas', '10', '2005-11-22', 'Male', 18, '306 Mabini St', 'Barangay Seis', 'Tagbilaran', 'Bohol', '09171234630', 'tomas.quinto@lnhs.com', 'Maria Quinto', 'Jose Quinto', '306 Mabini St', 'Driver', 'Vendor', 100000, 2, 'High School', 'High School', '09181234630', '09191234630', 'active', 'unarchive', '09171234631', 'Maria Quinto'),
(38, '133423847276', 'Rivera', 'Dela Cruz', 'Ursula', '10', '2005-12-30', 'Female', 18, '307 Rizal Ave', 'Barangay Siete', 'Tagbilaran', 'Bohol', '09171234632', 'ursula.rivera@lnhs.com', 'Ana Rivera', 'Pedro Rivera', '307 Rizal Ave', 'Carpenter', 'Housewife', 110000, 3, 'College', 'High School', '09181234632', '09191234632', 'active', 'unarchive', '09171234633', 'Ana Rivera'),
(39, '133423847277', 'Salazar', 'Mendoza', 'Vicente', '10', '2005-01-18', 'Male', 19, '308 Bonifacio St', 'Barangay Ocho', 'Tagbilaran', 'Bohol', '09171234634', 'vicente.salazar@lnhs.com', 'Carmen Salazar', 'Luis Salazar', '308 Bonifacio St', 'Farmer', 'Teacher', 120000, 1, 'College', 'College', '09181234634', '09191234634', 'active', 'unarchive', '09171234635', 'Carmen Salazar'),
(40, '133423847278', 'Torre', 'Reyes', 'Wendy', '10', '2005-02-25', 'Female', 19, '309 Luna St', 'Barangay Nueve', 'Tagbilaran', 'Bohol', '09171234636', 'wendy.torre@lnhs.com', 'Elena Torre', 'Carlos Torre', '309 Luna St', 'Driver', 'Vendor', 130000, 2, 'High School', 'High School', '09181234636', '09191234636', 'active', 'unarchive', '09171234637', 'Elena Torre'),
(41, '133423847279', 'Urbano', 'Villanueva', 'Xavier', '10', '2005-03-14', 'Male', 19, '310 Aguinaldo St', 'Barangay Diez', 'Tagbilaran', 'Bohol', '09171234638', 'xavier.urbano@lnhs.com', 'Rosa Urbano', 'Juan Urbano', '310 Aguinaldo St', 'Mechanic', 'Nurse', 140000, 4, 'College', 'College', '09181234638', '09191234638', 'active', 'unarchive', '09171234639', 'Rosa Urbano');

-- Insert into brigada_details
INSERT INTO brigada_details (student_id, remarks, school_year_id, brigada_status) VALUES
(32, '', 1, 'Not Attended'),
(33, '', 1, 'Not Attended'),
(34, '', 1, 'Not Attended'),
(35, '', 1, 'Not Attended'),
(36, '', 1, 'Not Attended'),
(37, '', 1, 'Not Attended'),
(38, '', 1, 'Not Attended'),
(39, '', 1, 'Not Attended'),
(40, '', 1, 'Not Attended'),
(41, '', 1, 'Not Attended');

-- Insert into users
INSERT INTO users (user_id, username, password, role_id, role_name) VALUES
(40, 'luna.clarissa@lnhs.com', '1234', 2, 'student'),
(41, 'mendoza.oscar@lnhs.com', '1234', 2, 'student'),
(42, 'nieves.regina@lnhs.com', '1234', 2, 'student'),
(43, 'ocampo.samuel@lnhs.com', '1234', 2, 'student'),
(44, 'pascual.teresa@lnhs.com', '1234', 2, 'student'),
(45, 'quinto.tomas@lnhs.com', '1234', 2, 'student'),
(46, 'rivera.ursula@lnhs.com', '1234', 2, 'student'),
(47, 'salazar.vicente@lnhs.com', '1234', 2, 'student'),
(48, 'torre.wendy@lnhs.com', '1234', 2, 'student'),
(49, 'urbano.xavier@lnhs.com', '1234', 2, 'student');

-- Insert into enrollment
INSERT INTO enrollment (enrollment_id, student_id, enrollment_date, grade_level, enrollee_type, brigada_id, enrollment_status, student_name, school_year_id)
VALUES
(32, 32, '2025-05-18', '10', 'Regular', 32, 'inactive', 'Clarissa Santos Luna', 1),
(33, 33, '2025-05-18', '10', 'Regular', 33, 'inactive', 'Oscar Lopez Mendoza', 1),
(34, 34, '2025-05-18', '10', 'Regular', 34, 'inactive', 'Regina Torres Nieves', 1),
(35, 35, '2025-05-18', '10', 'Regular', 35, 'inactive', 'Samuel Santos Ocampo', 1),
(36, 36, '2025-05-18', '10', 'Regular', 36, 'inactive', 'Teresa Cruz Pascual', 1),
(37, 37, '2025-05-18', '10', 'Regular', 37, 'inactive', 'Tomas Garcia Quinto', 1),
(38, 38, '2025-05-18', '10', 'Regular', 38, 'inactive', 'Ursula Dela Cruz Rivera', 1),
(39, 39, '2025-05-18', '10', 'Regular', 39, 'inactive', 'Vicente Mendoza Salazar', 1),
(40, 40, '2025-05-18', '10', 'Regular', 40, 'inactive', 'Wendy Reyes Torre', 1),
(41, 41, '2025-05-18', '10', 'Regular', 41, 'inactive', 'Xavier Villanueva Urbano', 1);

-- Insert into student_school_year
INSERT INTO student_school_year (student_id, school_year_id, status, student_name, grade_level) VALUES
(32, 1, 'active', 'Clarissa Santos Luna', 10),
(33, 1, 'active', 'Oscar Lopez Mendoza', 10),
(34, 1, 'active', 'Regina Torres Nieves', 10),
(35, 1, 'active', 'Samuel Santos Ocampo', 10),
(36, 1, 'active', 'Teresa Cruz Pascual', 10),
(37, 1, 'active', 'Tomas Garcia Quinto', 10),
(38, 1, 'active', 'Ursula Dela Cruz Rivera', 10),
(39, 1, 'active', 'Vicente Mendoza Salazar', 10),
(40, 1, 'active', 'Wendy Reyes Torre', 10),
(41, 1, 'active', 'Xavier Villanueva Urbano', 10);

-- END OF BULK INSERTS 