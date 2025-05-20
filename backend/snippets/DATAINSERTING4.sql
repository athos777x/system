/*
SQLyog Ultimate v9.62 
MySQL - 5.6.37-log : Database - lnhsportal
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`lnhsportal` /*!40100 DEFAULT CHARACTER SET utf8 */;

USE `lnhsportal`;

/*Table structure for table `attendance` */

DROP TABLE IF EXISTS `attendance`;

CREATE TABLE `attendance` (
  `attendance_id` int(11) NOT NULL AUTO_INCREMENT,
  `enrollment_id` int(12) DEFAULT NULL,
  `schedule_id` int(11) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `status` enum('P','A','L') DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `student_name` varchar(255) DEFAULT NULL,
  `remarks` timestamp NULL DEFAULT NULL,
  `subject_id` int(11) DEFAULT NULL,
  `school_year_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`attendance_id`),
  KEY `enrollment_id` (`enrollment_id`),
  KEY `schedule_id` (`schedule_id`),
  KEY `fk_student_id` (`student_id`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`enrollment_id`) REFERENCES `enrollment` (`enrollment_id`),
  CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`schedule_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `attendance` */

/*Table structure for table `brigada_details` */

DROP TABLE IF EXISTS `brigada_details`;

CREATE TABLE `brigada_details` (
  `brigada_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `remarks` varchar(100) DEFAULT NULL,
  `school_year_id` int(11) DEFAULT NULL,
  `brigada_status` enum('Attended','Not Attended') DEFAULT NULL,
  PRIMARY KEY (`brigada_id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8;

/*Data for the table `brigada_details` */

insert  into `brigada_details`(`brigada_id`,`student_id`,`remarks`,`school_year_id`,`brigada_status`) values (1,1,'',1,'Not Attended'),(2,2,'',1,'Not Attended'),(3,3,'',1,'Not Attended'),(4,4,'',1,'Not Attended'),(5,5,'',1,'Not Attended'),(6,6,'',1,'Not Attended'),(7,7,'',1,'Not Attended'),(8,8,'',1,'Not Attended'),(9,9,'',1,'Not Attended'),(10,10,'',1,'Not Attended'),(11,11,'',1,'Not Attended'),(12,12,'',1,'Not Attended'),(13,13,'',1,'Not Attended'),(14,14,'',1,'Not Attended'),(15,15,'',1,'Not Attended'),(16,16,'',1,'Not Attended'),(17,17,'',1,'Not Attended'),(18,18,'',1,'Not Attended'),(19,19,'',1,'Not Attended'),(20,20,'',1,'Not Attended'),(21,21,'',1,'Not Attended'),(22,22,'',1,'Not Attended'),(23,23,'',1,'Not Attended'),(24,24,'',1,'Not Attended'),(25,25,'',1,'Not Attended'),(26,26,'',1,'Not Attended'),(27,27,'',1,'Not Attended'),(28,28,'',1,'Not Attended'),(29,29,'',1,'Not Attended'),(30,30,'',1,'Not Attended'),(31,31,'',1,'Not Attended'),(32,32,'',1,'Not Attended'),(33,33,'',1,'Not Attended'),(34,34,'',1,'Not Attended'),(35,35,'',1,'Not Attended'),(36,36,'',1,'Not Attended'),(37,37,'',1,'Not Attended'),(38,38,'',1,'Not Attended'),(39,39,'',1,'Not Attended'),(40,40,'',1,'Not Attended'),(41,41,'',1,'Not Attended');

/*Table structure for table `employee` */

DROP TABLE IF EXISTS `employee`;

CREATE TABLE `employee` (
  `employee_id` int(11) NOT NULL AUTO_INCREMENT,
  `firstname` varchar(30) DEFAULT NULL,
  `lastname` varchar(30) DEFAULT NULL,
  `middlename` varchar(30) DEFAULT NULL,
  `status` enum('active','resigned','retired') NOT NULL DEFAULT 'active',
  `contact_number` varchar(11) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `year_started` varchar(4) DEFAULT NULL,
  `role_name` varchar(255) DEFAULT NULL,
  `role_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `archive_status` enum('unarchive','archived') NOT NULL DEFAULT 'unarchive',
  `gender` varchar(50) DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `email_address` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`employee_id`),
  KEY `fk_user_id` (`user_id`),
  KEY `fk_role` (`role_id`),
  CONSTRAINT `fk_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`),
  CONSTRAINT `fk_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;

/*Data for the table `employee` */

insert  into `employee`(`employee_id`,`firstname`,`lastname`,`middlename`,`status`,`contact_number`,`address`,`year_started`,`role_name`,`role_id`,`user_id`,`archive_status`,`gender`,`birthday`,`email_address`) values (1,'Dante','Roe','A.','active','09348394384','123 Main St','2020','principal',1,2,'unarchive','Male','2025-02-13','danteroe@gmail.com'),(2,'Zane','Youth','B.','active','09876543213','456 Elm St','2021','subject_teacher',3,3,'unarchive','Male','2025-06-05','zaneyouth@gmail.com'),(3,'John','Doe','T.','active','09378237827','123 Oak St','2022','class_adviser',4,4,'unarchive','Male','2025-04-10','johndoe@gmail.com'),(4,'Jane','Smith','A.','active','09234234324','456 Pine St','2023','grade_level_coordinator',5,5,'unarchive','Male','2020-06-25','janesmith@gmail.com'),(5,'Alaine','Johnson','E.','active','09343984938','789 Maple St','2023','registrar',6,6,'unarchive','Male','2025-01-13','alainejohnson@gmail.com'),(6,'Emily','Brown','C.','active','09876543213','789 Birch St','2023','academic_coordinator',7,7,'unarchive','Male','2015-07-17','emilybrown@gmail.com'),(7,'Michael','White','D.','active','09672167118','456 Oak St','2023','subject_coordinator',8,8,'unarchive','Male','2015-07-17','michaelwhite@gmail.com'),(8,'Anton','Dumayac','B','active','09826276272','Poblacion Sur, Antequera','2020','subject_teacher',3,50,'unarchive','Male','1997-06-26','antondumayac@gmail.com');

/*Table structure for table `enrollment` */

DROP TABLE IF EXISTS `enrollment`;

CREATE TABLE `enrollment` (
  `enrollment_id` int(12) NOT NULL AUTO_INCREMENT,
  `student_id` int(12) DEFAULT NULL,
  `section_id` int(11) DEFAULT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `enrollment_date` date DEFAULT NULL,
  `grade_level` varchar(5) DEFAULT NULL,
  `enrollee_type` varchar(20) DEFAULT NULL,
  `brigada_id` int(11) DEFAULT NULL,
  `enrollment_status` enum('active','pending','inactive') DEFAULT NULL,
  `student_name` varchar(255) DEFAULT NULL,
  `student_school_year_id` int(11) DEFAULT NULL,
  `school_year_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`enrollment_id`),
  KEY `student_id` (`student_id`),
  KEY `section_id` (`section_id`),
  KEY `enrolling_officer_id` (`employee_id`),
  KEY `fk_enrollment_student_school_year_id` (`student_school_year_id`),
  KEY `fk_enrollment_school_year_id` (`school_year_id`),
  CONSTRAINT `enrollment_ibfk_2` FOREIGN KEY (`section_id`) REFERENCES `section` (`section_id`),
  CONSTRAINT `enrollment_ibfk_3` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8;

/*Data for the table `enrollment` */

insert  into `enrollment`(`enrollment_id`,`student_id`,`section_id`,`employee_id`,`enrollment_date`,`grade_level`,`enrollee_type`,`brigada_id`,`enrollment_status`,`student_name`,`student_school_year_id`,`school_year_id`) values (1,1,1,NULL,'2025-05-18','7','Regular',1,'active','athrian judd j. pahang',NULL,1),(2,2,1,NULL,'2025-05-18','7','Regular',2,'active','Maria Clara Reyes Santos',NULL,1),(3,3,1,NULL,'2025-05-18','7','Regular',3,'active','Juan Lopez Dela Cruz',NULL,1),(4,4,1,NULL,'2025-05-18','7','Regular',4,'active','Josefina Torres Garcia',NULL,1),(5,5,1,NULL,'2025-05-18','7','Regular',5,'active','Miguel Santos Reyes',NULL,1),(6,6,1,NULL,'2025-05-18','7','Regular',6,'active','Andrea Cruz Mendoza',NULL,1),(7,7,1,NULL,'2025-05-18','7','Regular',7,'active','Carlos Garcia Torres',NULL,1),(8,8,1,NULL,'2025-05-18','7','Regular',8,'active','Sofia Dela Cruz Lopez',NULL,1),(9,9,1,NULL,'2025-05-18','7','Regular',9,'active','Gabriel Mendoza Cruz',NULL,1),(10,10,1,NULL,'2025-05-18','7','Regular',10,'active','Isabella Reyes Villanueva',NULL,1),(11,11,1,NULL,'2025-05-18','7','Regular',11,'active','Daniel Villanueva Ramos',NULL,1),(12,12,2,NULL,'2025-05-18','8','Regular',12,'active','Angela Santos Morales',NULL,1),(13,13,2,NULL,'2025-05-18','8','Regular',13,'active','Roberto Lopez Castro',NULL,1),(14,14,2,NULL,'2025-05-18','8','Regular',14,'active','Patricia Torres Navarro',NULL,1),(15,15,2,NULL,'2025-05-18','8','Regular',15,'active','Enrique Santos Ramos',NULL,1),(16,16,2,NULL,'2025-05-18','8','Regular',16,'active','Monica Cruz Gutierrez',NULL,1),(17,17,2,NULL,'2025-05-18','8','Regular',17,'active','Francisco Garcia Silva',NULL,1),(18,18,2,NULL,'2025-05-18','8','Regular',18,'active','Camila Dela Cruz Ortiz',NULL,1),(19,19,2,NULL,'2025-05-18','8','Regular',19,'active','Diego Mendoza Perez',NULL,1),(20,20,2,NULL,'2025-05-18','8','Regular',20,'active','Valeria Reyes Flores',NULL,1),(21,21,2,NULL,'2025-05-18','8','Regular',21,'active','Luis Villanueva Santiago',NULL,1),(22,22,3,NULL,'2025-05-18','9','Regular',22,'active','Jasmine Santos Aguilar',NULL,1),(23,23,3,NULL,'2025-05-18','9','Regular',23,'active','Marco Lopez Bautista',NULL,1),(24,24,3,NULL,'2025-05-18','9','Regular',24,'active','Nicole Torres Cabrera',NULL,1),(25,25,3,NULL,'2025-05-18','9','Regular',25,'active','Rafael Santos Domingo',NULL,1),(26,26,3,NULL,'2025-05-18','9','Regular',26,'active','Samantha Cruz Escobar',NULL,1),(27,27,3,NULL,'2025-05-18','9','Regular',27,'active','Victor Garcia Fernandez',NULL,1),(28,28,3,NULL,'2025-05-18','9','Regular',28,'active','Bianca Dela Cruz Gomez',NULL,1),(29,29,3,NULL,'2025-05-18','9','Regular',29,'active','Miguel Mendoza Hernandez',NULL,1),(30,30,3,NULL,'2025-05-18','9','Regular',30,'active','Sofia Reyes Ibarra',NULL,1),(31,31,3,NULL,'2025-05-18','9','Regular',31,'active','Andres Villanueva Jimenez',NULL,1),(32,32,4,NULL,'2025-05-18','10','Regular',32,'active','Clarissa Santos Luna',NULL,1),(33,33,4,NULL,'2025-05-18','10','Regular',33,'active','Oscar Lopez Mendoza',NULL,1),(34,34,4,NULL,'2025-05-18','10','Regular',34,'active','Regina Torres Nieves',NULL,1),(35,35,4,NULL,'2025-05-18','10','Regular',35,'active','Samuel Santos Ocampo',NULL,1),(36,36,4,NULL,'2025-05-18','10','Regular',36,'active','Teresa Cruz Pascual',NULL,1),(37,37,4,NULL,'2025-05-18','10','Regular',37,'active','Tomas Garcia Quinto',NULL,1),(38,38,4,NULL,'2025-05-18','10','Regular',38,'active','Ursula Dela Cruz Rivera',NULL,1),(39,39,4,NULL,'2025-05-18','10','Regular',39,'active','Vicente Mendoza Salazar',NULL,1),(40,40,4,NULL,'2025-05-18','10','Regular',40,'active','Wendy Reyes Torre',NULL,1),(41,41,4,NULL,'2025-05-18','10','Regular',41,'active','Xavier Villanueva Urbano',NULL,1);

/*Table structure for table `grade_activity_logs` */

DROP TABLE IF EXISTS `grade_activity_logs`;

CREATE TABLE `grade_activity_logs` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  `action` varchar(50) NOT NULL COMMENT 'e.g., Created, Updated, Submitted, Deleted',
  `student_id` int(11) NOT NULL,
  `student_name` varchar(255) DEFAULT NULL,
  `subject_name` varchar(255) DEFAULT NULL,
  `quarter` varchar(50) DEFAULT NULL COMMENT 'e.g., Q1, Q2, Q3, Q4',
  `user_id` int(11) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `details` text,
  `grade_level` int(11) DEFAULT NULL,
  `school_year_id` int(11) DEFAULT NULL,
  `timestamp` datetime NOT NULL,
  PRIMARY KEY (`log_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_school_year_id` (`school_year_id`),
  KEY `idx_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `grade_activity_logs` */

/*Table structure for table `grade_level_assigned` */

DROP TABLE IF EXISTS `grade_level_assigned`;

CREATE TABLE `grade_level_assigned` (
  `grade_level_assigned_id` int(12) NOT NULL AUTO_INCREMENT,
  `employee_id` int(12) DEFAULT NULL,
  `grade_level` int(12) DEFAULT NULL,
  `school_year_id` int(12) DEFAULT NULL,
  PRIMARY KEY (`grade_level_assigned_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `grade_level_assigned` */

/*Table structure for table `grade_submission_status` */

DROP TABLE IF EXISTS `grade_submission_status`;

CREATE TABLE `grade_submission_status` (
  `status_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `subject_name` varchar(255) NOT NULL,
  `quarter` varchar(10) NOT NULL COMMENT '1, 2, 3, or 4',
  `status` varchar(50) NOT NULL DEFAULT 'draft' COMMENT 'draft or submitted',
  `school_year_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`status_id`),
  UNIQUE KEY `idx_student_subject_quarter` (`student_id`,`subject_name`,`quarter`,`school_year_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_school_year_id` (`school_year_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `grade_submission_status` */

/*Table structure for table `grades` */

DROP TABLE IF EXISTS `grades`;

CREATE TABLE `grades` (
  `grades_id` int(11) NOT NULL AUTO_INCREMENT,
  `schedule_id` int(11) DEFAULT NULL,
  `enrollment_id` int(12) DEFAULT NULL,
  `grade_level` int(11) NOT NULL,
  `subject_name` varchar(255) NOT NULL,
  `grade` float DEFAULT NULL,
  `period` int(11) NOT NULL,
  `remarks` text,
  `student_id` int(11) NOT NULL,
  `student_name` varchar(255) NOT NULL,
  `school_year_id` int(11) DEFAULT NULL,
  `section_id` int(11) DEFAULT NULL,
  `grade_state` varchar(255) DEFAULT NULL,
  `logs` varchar(255) DEFAULT NULL,
  `log_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`grades_id`,`grade_level`,`subject_name`,`period`,`student_id`,`student_name`),
  UNIQUE KEY `unique_student_grade` (`student_id`,`subject_name`,`grade_level`,`period`,`school_year_id`,`section_id`),
  KEY `schedule_id` (`schedule_id`),
  KEY `enrollment_id` (`enrollment_id`),
  KEY `fk_grades_student_id` (`student_id`),
  KEY `fk_grades_school_year_id` (`school_year_id`),
  CONSTRAINT `grades_ibfk_1` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`schedule_id`),
  CONSTRAINT `grades_ibfk_2` FOREIGN KEY (`enrollment_id`) REFERENCES `enrollment` (`enrollment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8;

/*Data for the table `grades` */

insert  into `grades`(`grades_id`,`schedule_id`,`enrollment_id`,`grade_level`,`subject_name`,`grade`,`period`,`remarks`,`student_id`,`student_name`,`school_year_id`,`section_id`,`grade_state`,`logs`,`log_date`) values (1,NULL,NULL,7,'English 7',82,1,NULL,1,'Athrian Judd Pahang',1,1,'submitted',NULL,NULL),(2,NULL,NULL,7,'English 7',81,2,NULL,1,'Athrian Judd Pahang',1,1,'submitted',NULL,NULL),(3,NULL,NULL,7,'English 7',87,3,NULL,1,'Athrian Judd Pahang',1,1,'submitted',NULL,NULL),(4,NULL,NULL,7,'English 7',82,4,NULL,1,'Athrian Judd Pahang',1,1,'submitted',NULL,NULL),(9,NULL,NULL,7,'Math 7',81,1,NULL,1,'Athrian Judd Pahang',1,1,'submitted',NULL,NULL),(10,NULL,NULL,7,'Math 7',91,2,NULL,1,'Athrian Judd Pahang',1,1,'submitted',NULL,NULL),(11,NULL,NULL,7,'Math 7',82,3,NULL,1,'Athrian Judd Pahang',1,1,'submitted',NULL,NULL),(12,NULL,NULL,7,'Math 7',81,4,NULL,1,'Athrian Judd Pahang',1,1,'submitted',NULL,NULL),(17,NULL,NULL,7,'English 7',89,1,NULL,9,'Gabriel Cruz',1,1,NULL,NULL,NULL),(18,NULL,NULL,7,'English 7',82,2,NULL,9,'Gabriel Cruz',1,1,NULL,NULL,NULL),(19,NULL,NULL,7,'English 7',78,3,NULL,9,'Gabriel Cruz',1,1,NULL,NULL,NULL),(20,NULL,NULL,7,'English 7',89,4,NULL,9,'Gabriel Cruz',1,1,NULL,NULL,NULL),(21,NULL,NULL,7,'Math 7',83,1,NULL,9,'Gabriel Cruz',1,1,NULL,NULL,NULL),(22,NULL,NULL,7,'Math 7',86,2,NULL,9,'Gabriel Cruz',1,1,NULL,NULL,NULL),(23,NULL,NULL,7,'Math 7',82,3,NULL,9,'Gabriel Cruz',1,1,NULL,NULL,NULL),(24,NULL,NULL,7,'Math 7',81,4,NULL,9,'Gabriel Cruz',1,1,NULL,NULL,NULL),(25,NULL,NULL,7,'English 7',91,1,NULL,3,'Juan Dela Cruz',1,1,NULL,NULL,NULL),(26,NULL,NULL,7,'English 7',95,2,NULL,3,'Juan Dela Cruz',1,1,NULL,NULL,NULL),(27,NULL,NULL,7,'English 7',92,3,NULL,3,'Juan Dela Cruz',1,1,NULL,NULL,NULL),(28,NULL,NULL,7,'English 7',92,4,NULL,3,'Juan Dela Cruz',1,1,NULL,NULL,NULL),(29,NULL,NULL,7,'Math 7',98,1,NULL,3,'Juan Dela Cruz',1,1,NULL,NULL,NULL),(30,NULL,NULL,7,'Math 7',95,2,NULL,3,'Juan Dela Cruz',1,1,NULL,NULL,NULL),(31,NULL,NULL,7,'Math 7',92,3,NULL,3,'Juan Dela Cruz',1,1,NULL,NULL,NULL),(32,NULL,NULL,7,'Math 7',95,4,NULL,3,'Juan Dela Cruz',1,1,NULL,NULL,NULL),(33,NULL,NULL,7,'English 7',92,1,NULL,4,'Josefina Garcia',1,1,NULL,NULL,NULL),(34,NULL,NULL,7,'English 7',91,2,NULL,4,'Josefina Garcia',1,1,NULL,NULL,NULL),(35,NULL,NULL,7,'English 7',93,3,NULL,4,'Josefina Garcia',1,1,NULL,NULL,NULL),(36,NULL,NULL,7,'English 7',95,4,NULL,4,'Josefina Garcia',1,1,NULL,NULL,NULL),(37,NULL,NULL,7,'Math 7',91,1,NULL,4,'Josefina Garcia',1,1,NULL,NULL,NULL),(38,NULL,NULL,7,'Math 7',95,2,NULL,4,'Josefina Garcia',1,1,NULL,NULL,NULL),(39,NULL,NULL,7,'Math 7',95,3,NULL,4,'Josefina Garcia',1,1,NULL,NULL,NULL),(40,NULL,NULL,7,'Math 7',91,4,NULL,4,'Josefina Garcia',1,1,NULL,NULL,NULL),(41,NULL,NULL,7,'English 7',89,1,NULL,8,'Sofia Lopez',1,1,NULL,NULL,NULL),(42,NULL,NULL,7,'English 7',86,2,NULL,8,'Sofia Lopez',1,1,NULL,NULL,NULL),(43,NULL,NULL,7,'English 7',95,3,NULL,8,'Sofia Lopez',1,1,NULL,NULL,NULL),(44,NULL,NULL,7,'English 7',92,4,NULL,8,'Sofia Lopez',1,1,NULL,NULL,NULL),(45,NULL,NULL,7,'Math 7',91,1,NULL,8,'Sofia Lopez',1,1,NULL,NULL,NULL),(46,NULL,NULL,7,'Math 7',89,2,NULL,8,'Sofia Lopez',1,1,NULL,NULL,NULL),(47,NULL,NULL,7,'Math 7',84,3,NULL,8,'Sofia Lopez',1,1,NULL,NULL,NULL),(48,NULL,NULL,7,'Math 7',92,4,NULL,8,'Sofia Lopez',1,1,NULL,NULL,NULL),(49,NULL,NULL,7,'English 7',89,1,NULL,6,'Andrea Mendoza',1,1,NULL,NULL,NULL),(50,NULL,NULL,7,'English 7',92,2,NULL,6,'Andrea Mendoza',1,1,NULL,NULL,NULL),(51,NULL,NULL,7,'English 7',91,3,NULL,6,'Andrea Mendoza',1,1,NULL,NULL,NULL),(52,NULL,NULL,7,'English 7',91,4,NULL,6,'Andrea Mendoza',1,1,NULL,NULL,NULL),(53,NULL,NULL,7,'Math 7',89,1,NULL,6,'Andrea Mendoza',1,1,NULL,NULL,NULL),(54,NULL,NULL,7,'Math 7',82,2,NULL,6,'Andrea Mendoza',1,1,NULL,NULL,NULL),(55,NULL,NULL,7,'Math 7',81,3,NULL,6,'Andrea Mendoza',1,1,NULL,NULL,NULL),(56,NULL,NULL,7,'Math 7',86,4,NULL,6,'Andrea Mendoza',1,1,NULL,NULL,NULL),(57,NULL,NULL,7,'English 7',89,1,NULL,11,'Daniel Ramos',1,1,NULL,NULL,NULL),(58,NULL,NULL,7,'English 7',90,2,NULL,11,'Daniel Ramos',1,1,NULL,NULL,NULL),(59,NULL,NULL,7,'English 7',93,3,NULL,11,'Daniel Ramos',1,1,NULL,NULL,NULL),(60,NULL,NULL,7,'English 7',92,4,NULL,11,'Daniel Ramos',1,1,NULL,NULL,NULL),(61,NULL,NULL,7,'Math 7',98,1,NULL,11,'Daniel Ramos',1,1,NULL,NULL,NULL),(62,NULL,NULL,7,'Math 7',95,2,NULL,11,'Daniel Ramos',1,1,NULL,NULL,NULL),(63,NULL,NULL,7,'Math 7',89,3,NULL,11,'Daniel Ramos',1,1,NULL,NULL,NULL),(64,NULL,NULL,7,'Math 7',92,4,NULL,11,'Daniel Ramos',1,1,NULL,NULL,NULL),(65,NULL,NULL,7,'English 7',93,1,NULL,5,'Miguel Reyes',1,1,NULL,NULL,NULL),(66,NULL,NULL,7,'English 7',95,2,NULL,5,'Miguel Reyes',1,1,NULL,NULL,NULL),(67,NULL,NULL,7,'English 7',91,3,NULL,5,'Miguel Reyes',1,1,NULL,NULL,NULL),(68,NULL,NULL,7,'English 7',96,4,NULL,5,'Miguel Reyes',1,1,NULL,NULL,NULL),(69,NULL,NULL,7,'Math 7',96,1,NULL,5,'Miguel Reyes',1,1,NULL,NULL,NULL),(70,NULL,NULL,7,'Math 7',92,2,NULL,5,'Miguel Reyes',1,1,NULL,NULL,NULL),(71,NULL,NULL,7,'Math 7',91,3,NULL,5,'Miguel Reyes',1,1,NULL,NULL,NULL),(72,NULL,NULL,7,'Math 7',96,4,NULL,5,'Miguel Reyes',1,1,NULL,NULL,NULL),(73,NULL,NULL,7,'English 7',91,1,NULL,2,'Maria Clara Santos',1,1,NULL,NULL,NULL),(74,NULL,NULL,7,'English 7',95,2,NULL,2,'Maria Clara Santos',1,1,NULL,NULL,NULL),(75,NULL,NULL,7,'English 7',96,3,NULL,2,'Maria Clara Santos',1,1,NULL,NULL,NULL),(76,NULL,NULL,7,'English 7',91,4,NULL,2,'Maria Clara Santos',1,1,NULL,NULL,NULL),(77,NULL,NULL,7,'Math 7',96,1,NULL,2,'Maria Clara Santos',1,1,NULL,NULL,NULL),(78,NULL,NULL,7,'Math 7',92,2,NULL,2,'Maria Clara Santos',1,1,NULL,NULL,NULL),(79,NULL,NULL,7,'Math 7',93,3,NULL,2,'Maria Clara Santos',1,1,NULL,NULL,NULL),(80,NULL,NULL,7,'Math 7',96,4,NULL,2,'Maria Clara Santos',1,1,NULL,NULL,NULL),(81,NULL,NULL,7,'English 7',76,1,NULL,7,'Carlos Torres',1,1,NULL,NULL,NULL),(82,NULL,NULL,7,'English 7',72,2,NULL,7,'Carlos Torres',1,1,NULL,NULL,NULL),(83,NULL,NULL,7,'English 7',72,3,NULL,7,'Carlos Torres',1,1,NULL,NULL,NULL),(84,NULL,NULL,7,'English 7',71,4,NULL,7,'Carlos Torres',1,1,NULL,NULL,NULL),(85,NULL,NULL,7,'Math 7',79,1,NULL,7,'Carlos Torres',1,1,NULL,NULL,NULL),(86,NULL,NULL,7,'Math 7',72,2,NULL,7,'Carlos Torres',1,1,NULL,NULL,NULL),(87,NULL,NULL,7,'Math 7',75,3,NULL,7,'Carlos Torres',1,1,NULL,NULL,NULL),(88,NULL,NULL,7,'Math 7',73,4,NULL,7,'Carlos Torres',1,1,NULL,NULL,NULL),(89,NULL,NULL,7,'English 7',82,1,NULL,10,'Isabella Villanueva',1,1,NULL,NULL,NULL),(90,NULL,NULL,7,'English 7',85,2,NULL,10,'Isabella Villanueva',1,1,NULL,NULL,NULL),(91,NULL,NULL,7,'English 7',82,3,NULL,10,'Isabella Villanueva',1,1,NULL,NULL,NULL),(92,NULL,NULL,7,'English 7',81,4,NULL,10,'Isabella Villanueva',1,1,NULL,NULL,NULL),(93,NULL,NULL,7,'Math 7',84,1,NULL,10,'Isabella Villanueva',1,1,NULL,NULL,NULL),(94,NULL,NULL,7,'Math 7',86,2,NULL,10,'Isabella Villanueva',1,1,NULL,NULL,NULL),(95,NULL,NULL,7,'Math 7',81,3,NULL,10,'Isabella Villanueva',1,1,NULL,NULL,NULL),(96,NULL,NULL,7,'Math 7',83,4,NULL,10,'Isabella Villanueva',1,1,NULL,NULL,NULL),(97,NULL,NULL,9,'English 9',80,1,NULL,22,'Jasmine Aguilar',1,3,NULL,'6','2025-05-20 06:50:44'),(98,NULL,NULL,9,'Math 9',80,1,NULL,22,'Jasmine Aguilar',1,3,NULL,'3','2025-05-20 06:52:03');

/*Table structure for table `roles` */

DROP TABLE IF EXISTS `roles`;

CREATE TABLE `roles` (
  `role_id` int(11) NOT NULL AUTO_INCREMENT,
  `role_name` varchar(255) DEFAULT NULL,
  `role_description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`role_id`),
  KEY `idx_role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;

/*Data for the table `roles` */

insert  into `roles`(`role_id`,`role_name`,`role_description`) values (1,'principal','Principal role'),(2,'student','Student role'),(3,'subject_teacher','Subject Teacher role'),(4,'class_adviser','Class Adviser role'),(5,'grade_level_coordinator','Grade Level Coordinator role'),(6,'registrar','Registrar role'),(7,'academic_coordinator','Academic Coordinator role'),(8,'subject_coordinator','Subject Coordinator role');

/*Table structure for table `schedule` */

DROP TABLE IF EXISTS `schedule`;

CREATE TABLE `schedule` (
  `schedule_id` int(11) NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) DEFAULT NULL,
  `subject_id` int(11) DEFAULT NULL,
  `time_start` varchar(12) DEFAULT NULL,
  `time_end` varchar(12) DEFAULT NULL,
  `day` varchar(225) DEFAULT NULL,
  `section_id` int(11) DEFAULT NULL,
  `schedule_status` enum('Approved','Pending Approval') NOT NULL DEFAULT 'Pending Approval',
  `elective` int(11) NOT NULL DEFAULT '0',
  `grade_level` int(11) DEFAULT NULL,
  `school_year_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`schedule_id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `subject_id` (`subject_id`),
  KEY `fk_schedule_section_id` (`section_id`),
  CONSTRAINT `fk_schedule_section_id` FOREIGN KEY (`section_id`) REFERENCES `section` (`section_id`),
  CONSTRAINT `schedule_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;

/*Data for the table `schedule` */

insert  into `schedule`(`schedule_id`,`teacher_id`,`subject_id`,`time_start`,`time_end`,`day`,`section_id`,`schedule_status`,`elective`,`grade_level`,`school_year_id`) values (1,8,1,'07:00','08:00','[\"Monday\",\"Tuesday\",\"Wednesday\",\"Thursday\",\"Friday\"]',1,'Approved',0,7,1),(2,2,2,'08:00','09:00','[\"Monday\",\"Tuesday\",\"Wednesday\",\"Thursday\",\"Friday\"]',1,'Approved',0,7,1),(3,8,3,'09:00','10:00','[\"Monday\",\"Tuesday\",\"Wednesday\",\"Thursday\",\"Friday\"]',2,'Approved',0,8,1),(4,2,4,'10:00','11:00','[\"Monday\",\"Tuesday\",\"Wednesday\",\"Thursday\",\"Friday\"]',2,'Approved',0,8,1),(5,8,5,'11:00','12:00','[\"Monday\",\"Tuesday\",\"Wednesday\",\"Thursday\",\"Friday\"]',3,'Approved',0,9,1),(6,2,6,'12:00','13:00','[\"Monday\",\"Tuesday\",\"Wednesday\",\"Thursday\",\"Friday\"]',3,'Approved',0,9,1),(7,8,7,'13:00','14:00','[\"Monday\",\"Tuesday\",\"Wednesday\",\"Thursday\",\"Friday\"]',4,'Approved',0,10,1),(8,2,8,'14:00','15:00','[\"Monday\",\"Tuesday\",\"Wednesday\",\"Thursday\",\"Friday\"]',4,'Approved',0,10,1);

/*Table structure for table `school_year` */

DROP TABLE IF EXISTS `school_year`;

CREATE TABLE `school_year` (
  `school_year_id` int(11) NOT NULL AUTO_INCREMENT,
  `school_year_start` date DEFAULT NULL,
  `school_year_end` date DEFAULT NULL,
  `school_year` varchar(10) DEFAULT NULL,
  `enrollment_start` date DEFAULT NULL,
  `enrollment_end` date DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`school_year_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

/*Data for the table `school_year` */

insert  into `school_year`(`school_year_id`,`school_year_start`,`school_year_end`,`school_year`,`enrollment_start`,`enrollment_end`,`status`) values (1,'2025-05-18','2026-05-18','2025-2026','2025-05-18','2025-05-25','active');

/*Table structure for table `section` */

DROP TABLE IF EXISTS `section`;

CREATE TABLE `section` (
  `section_id` int(11) NOT NULL AUTO_INCREMENT,
  `section_name` varchar(30) DEFAULT NULL,
  `grade_level` varchar(5) DEFAULT NULL,
  `status` varchar(8) DEFAULT NULL,
  `max_capacity` int(4) DEFAULT NULL,
  `school_year_id` int(11) DEFAULT NULL,
  `room_number` int(11) DEFAULT NULL,
  `archive_status` varchar(255) DEFAULT NULL,
  `section_adviser` int(11) DEFAULT NULL,
  PRIMARY KEY (`section_id`),
  KEY `fk_section_school_year_id` (`school_year_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8;

/*Data for the table `section` */

insert  into `section`(`section_id`,`section_name`,`grade_level`,`status`,`max_capacity`,`school_year_id`,`room_number`,`archive_status`,`section_adviser`) values (1,'Phoenix','7','active',50,1,102,'unarchive',NULL),(2,'Orion','8','active',50,1,201,'unarchive',NULL),(3,'Lyra','9','active',50,1,301,'unarchive',NULL),(4,'Cygnus','10','active',50,1,401,'unarchive',NULL);

/*Table structure for table `section_assigned` */

DROP TABLE IF EXISTS `section_assigned`;

CREATE TABLE `section_assigned` (
  `section_assigned_id` int(11) NOT NULL AUTO_INCREMENT,
  `section_id` int(11) NOT NULL,
  `level` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `school_year_id` int(11) NOT NULL,
  PRIMARY KEY (`section_assigned_id`),
  UNIQUE KEY `unique_teacher_subject` (`section_id`,`employee_id`,`school_year_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

/*Data for the table `section_assigned` */

insert  into `section_assigned`(`section_assigned_id`,`section_id`,`level`,`employee_id`,`school_year_id`) values (1,1,7,3,1);

/*Table structure for table `student` */

DROP TABLE IF EXISTS `student`;

CREATE TABLE `student` (
  `student_id` int(12) NOT NULL,
  `lrn` varchar(12) DEFAULT NULL,
  `lastname` varchar(30) DEFAULT NULL,
  `middlename` varchar(30) DEFAULT NULL,
  `firstname` varchar(30) DEFAULT NULL,
  `current_yr_lvl` varchar(11) DEFAULT NULL,
  `birthdate` date DEFAULT NULL,
  `gender` enum('Male','Female') DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `home_address` varchar(255) DEFAULT NULL,
  `barangay` varchar(50) DEFAULT NULL,
  `city_municipality` varchar(50) DEFAULT NULL,
  `province` varchar(50) DEFAULT NULL,
  `contact_number` varchar(11) DEFAULT NULL,
  `email_address` varchar(50) DEFAULT NULL,
  `mother_name` varchar(50) DEFAULT NULL,
  `father_name` varchar(50) DEFAULT NULL,
  `parent_address` varchar(255) DEFAULT NULL,
  `father_occupation` varchar(50) DEFAULT NULL,
  `mother_occupation` varchar(50) DEFAULT NULL,
  `annual_hshld_income` double(10,2) DEFAULT NULL,
  `number_of_siblings` int(3) DEFAULT NULL,
  `father_educ_lvl` varchar(30) DEFAULT NULL,
  `mother_educ_lvl` varchar(30) DEFAULT NULL,
  `father_contact_number` varchar(11) DEFAULT NULL,
  `mother_contact_number` varchar(11) DEFAULT NULL,
  `id_picture` varchar(100) DEFAULT NULL,
  `birth_certificate` varchar(100) DEFAULT NULL,
  `form_138` varchar(100) DEFAULT NULL,
  `goodmoral_cert` varchar(100) DEFAULT NULL,
  `rcv_test` varchar(100) DEFAULT NULL,
  `section_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `emergency_number` varchar(11) DEFAULT NULL,
  `status` enum('active','inactive','transferred','withdrawn') DEFAULT 'active',
  `active_status` enum('unarchive','archived') DEFAULT 'unarchive',
  `brigada_id` int(11) DEFAULT NULL,
  `enroll_date` date DEFAULT NULL,
  `emergency_relation` varchar(50) DEFAULT NULL,
  `emergency_contactperson` varchar(50) DEFAULT NULL,
  KEY `fk_section` (`section_id`),
  KEY `fk_student_user_id` (`user_id`),
  CONSTRAINT `fk_section` FOREIGN KEY (`section_id`) REFERENCES `section` (`section_id`),
  CONSTRAINT `fk_student_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `student` */

insert  into `student`(`student_id`,`lrn`,`lastname`,`middlename`,`firstname`,`current_yr_lvl`,`birthdate`,`gender`,`age`,`home_address`,`barangay`,`city_municipality`,`province`,`contact_number`,`email_address`,`mother_name`,`father_name`,`parent_address`,`father_occupation`,`mother_occupation`,`annual_hshld_income`,`number_of_siblings`,`father_educ_lvl`,`mother_educ_lvl`,`father_contact_number`,`mother_contact_number`,`id_picture`,`birth_certificate`,`form_138`,`goodmoral_cert`,`rcv_test`,`section_id`,`user_id`,`emergency_number`,`status`,`active_status`,`brigada_id`,`enroll_date`,`emergency_relation`,`emergency_contactperson`) values (1,'133423847239','Pahang','Jaculba','Athrian Judd','7','2008-05-18','Male',17,'Poblacion Sur, Antequera','Barangay Uno','Antequera','Bohol','09568524589','athrianpahang@gmail.com','Judybeth Pahang','Carlo Pahang','Poblacion Sur, Antequera','Ofw','Ofw',1000000.00,1,'College Graduate','College Graduate','09783483647','09828372867',NULL,NULL,NULL,NULL,NULL,1,9,'09374364736','active','unarchive',1,'2025-05-18',NULL,'Judito Pahang'),(2,'133423847240','Santos','Reyes','Maria Clara','7','2008-06-12','Female',16,'123 Mabini St','Barangay Dos','Tagbilaran','Bohol','09171234560','mariaclara.santos@lnhs.com','Luz Santos','Jose Santos','123 Mabini St','Driver','Vendor',50000.00,2,'High School','College','09181234560','09191234560',NULL,NULL,NULL,NULL,NULL,1,NULL,'09171234561','active','unarchive',NULL,NULL,NULL,'Luz Santos'),(3,'133423847241','Dela Cruz','Lopez','Juan','7','2008-07-15','Male',15,'456 Rizal Ave','Barangay Tres','Tagbilaran','Bohol','09171234562','juan.delacruz@lnhs.com','Ana Dela Cruz','Pedro Dela Cruz','456 Rizal Ave','Carpenter','Housewife',60000.00,3,'College','High School','09181234562','09191234562',NULL,NULL,NULL,NULL,NULL,1,NULL,'09171234563','active','unarchive',NULL,NULL,NULL,'Ana Dela Cruz'),(4,'133423847242','Garcia','Torres','Josefina','7','2008-08-20','Female',15,'789 Bonifacio St','Barangay Uno','Tagbilaran','Bohol','09171234564','josefina.garcia@lnhs.com','Carmen Garcia','Luis Garcia','789 Bonifacio St','Farmer','Teacher',70000.00,1,'College','College','09181234564','09191234564',NULL,NULL,NULL,NULL,NULL,1,NULL,'09171234565','active','unarchive',NULL,NULL,NULL,'Carmen Garcia'),(5,'133423847243','Reyes','Santos','Miguel','7','2008-09-10','Male',15,'321 Luna St','Barangay Quatro','Tagbilaran','Bohol','09171234566','miguel.reyes@lnhs.com','Elena Reyes','Carlos Reyes','321 Luna St','Driver','Vendor',80000.00,2,'High School','High School','09181234566','09191234566',NULL,NULL,NULL,NULL,NULL,1,NULL,'09171234567','active','unarchive',NULL,NULL,NULL,'Elena Reyes'),(6,'133423847244','Mendoza','Cruz','Andrea','7','2008-10-05','Female',15,'654 Aguinaldo St','Barangay Cinco','Tagbilaran','Bohol','09171234568','andrea.mendoza@lnhs.com','Rosa Mendoza','Juan Mendoza','654 Aguinaldo St','Mechanic','Nurse',90000.00,4,'College','College','09181234568','09191234568',NULL,NULL,NULL,NULL,NULL,1,NULL,'09171234569','active','unarchive',NULL,NULL,NULL,'Rosa Mendoza'),(7,'133423847245','Torres','Garcia','Carlos','7','2008-11-22','Male',15,'987 Mabini St','Barangay Seis','Tagbilaran','Bohol','09171234570','carlos.torres@lnhs.com','Maria Torres','Jose Torres','987 Mabini St','Driver','Vendor',100000.00,2,'High School','High School','09181234570','09191234570',NULL,NULL,NULL,NULL,NULL,1,NULL,'09171234571','active','unarchive',NULL,NULL,NULL,'Maria Torres'),(8,'133423847246','Lopez','Dela Cruz','Sofia','7','2008-12-30','Female',15,'159 Rizal Ave','Barangay Siete','Tagbilaran','Bohol','09171234572','sofia.lopez@lnhs.com','Ana Lopez','Pedro Lopez','159 Rizal Ave','Carpenter','Housewife',110000.00,3,'College','High School','09181234572','09191234572',NULL,NULL,NULL,NULL,NULL,1,NULL,'09171234573','active','archived',NULL,NULL,NULL,'Ana Lopez'),(9,'133423847247','Cruz','Mendoza','Gabriel','7','2008-01-18','Male',16,'753 Bonifacio St','Barangay Ocho','Tagbilaran','Bohol','09171234574','gabriel.cruz@lnhs.com','Carmen Cruz','Luis Cruz','753 Bonifacio St','Farmer','Teacher',120000.00,1,'College','College','09181234574','09191234574',NULL,NULL,NULL,NULL,NULL,1,NULL,'09171234575','active','unarchive',NULL,NULL,NULL,'Carmen Cruz'),(10,'133423847248','Villanueva','Reyes','Isabella','7','2008-02-25','Female',16,'852 Luna St','Barangay Nueve','Tagbilaran','Bohol','09171234576','isabella.villanueva@lnhs.com','Elena Villanueva','Carlos Villanueva','852 Luna St','Driver','Vendor',130000.00,2,'High School','High School','09181234576','09191234576',NULL,NULL,NULL,NULL,NULL,1,NULL,'09171234577','active','unarchive',NULL,NULL,NULL,'Elena Villanueva'),(11,'133423847249','Ramos','Villanueva','Daniel','7','2008-03-14','Male',16,'951 Aguinaldo St','Barangay Diez','Tagbilaran','Bohol','09171234578','daniel.ramos@lnhs.com','Rosa Ramos','Juan Ramos','951 Aguinaldo St','Mechanic','Nurse',140000.00,4,'College','College','09181234578','09191234578',NULL,NULL,NULL,NULL,NULL,1,NULL,'09171234579','active','unarchive',NULL,NULL,NULL,'Rosa Ramos'),(12,'133423847250','Morales','Santos','Angela','8','2007-06-12','Female',17,'111 Mabini St','Barangay Dos','Tagbilaran','Bohol','09171234580','angela.morales@lnhs.com','Luz Morales','Jose Morales','111 Mabini St','Driver','Vendor',50000.00,2,'High School','College','09181234580','09191234580',NULL,NULL,NULL,NULL,NULL,2,NULL,'09171234581','active','unarchive',NULL,NULL,NULL,'Luz Morales'),(13,'133423847251','Castro','Lopez','Roberto','8','2007-07-15','Male',16,'222 Rizal Ave','Barangay Tres','Tagbilaran','Bohol','09171234582','roberto.castro@lnhs.com','Ana Castro','Pedro Castro','222 Rizal Ave','Carpenter','Housewife',60000.00,3,'College','High School','09181234582','09191234582',NULL,NULL,NULL,NULL,NULL,2,NULL,'09171234583','active','unarchive',NULL,NULL,NULL,'Ana Castro'),(14,'133423847252','Navarro','Torres','Patricia','8','2007-08-20','Female',16,'333 Bonifacio St','Barangay Uno','Tagbilaran','Bohol','09171234584','patricia.navarro@lnhs.com','Carmen Navarro','Luis Navarro','333 Bonifacio St','Farmer','Teacher',70000.00,1,'College','College','09181234584','09191234584',NULL,NULL,NULL,NULL,NULL,2,NULL,'09171234585','active','unarchive',NULL,NULL,NULL,'Carmen Navarro'),(15,'133423847253','Ramos','Santos','Enrique','8','2007-09-10','Male',16,'444 Luna St','Barangay Quatro','Tagbilaran','Bohol','09171234586','enrique.ramos@lnhs.com','Elena Ramos','Carlos Ramos','444 Luna St','Driver','Vendor',80000.00,2,'High School','High School','09181234586','09191234586',NULL,NULL,NULL,NULL,NULL,2,NULL,'09171234587','active','unarchive',NULL,NULL,NULL,'Elena Ramos'),(16,'133423847254','Gutierrez','Cruz','Monica','8','2007-10-05','Female',16,'555 Aguinaldo St','Barangay Cinco','Tagbilaran','Bohol','09171234588','monica.gutierrez@lnhs.com','Rosa Gutierrez','Juan Gutierrez','555 Aguinaldo St','Mechanic','Nurse',90000.00,4,'College','College','09181234588','09191234588',NULL,NULL,NULL,NULL,NULL,2,NULL,'09171234589','active','archived',NULL,NULL,NULL,'Rosa Gutierrez'),(17,'133423847255','Silva','Garcia','Francisco','8','2007-11-22','Male',16,'666 Mabini St','Barangay Seis','Tagbilaran','Bohol','09171234590','francisco.silva@lnhs.com','Maria Silva','Jose Silva','666 Mabini St','Driver','Vendor',100000.00,2,'High School','High School','09181234590','09191234590',NULL,NULL,NULL,NULL,NULL,2,NULL,'09171234591','active','unarchive',NULL,NULL,NULL,'Maria Silva'),(18,'133423847256','Ortiz','Dela Cruz','Camila','8','2007-12-30','Female',16,'777 Rizal Ave','Barangay Siete','Tagbilaran','Bohol','09171234592','camila.ortiz@lnhs.com','Ana Ortiz','Pedro Ortiz','777 Rizal Ave','Carpenter','Housewife',110000.00,3,'College','High School','09181234592','09191234592',NULL,NULL,NULL,NULL,NULL,2,NULL,'09171234593','active','archived',NULL,NULL,NULL,'Ana Ortiz'),(19,'133423847257','Perez','Mendoza','Diego','8','2007-01-18','Male',17,'888 Bonifacio St','Barangay Ocho','Tagbilaran','Bohol','09171234594','diego.perez@lnhs.com','Carmen Perez','Luis Perez','888 Bonifacio St','Farmer','Teacher',120000.00,1,'College','College','09181234594','09191234594',NULL,NULL,NULL,NULL,NULL,2,NULL,'09171234595','active','unarchive',NULL,NULL,NULL,'Carmen Perez'),(20,'133423847258','Flores','Reyes','Valeria','8','2007-02-25','Female',17,'999 Luna St','Barangay Nueve','Tagbilaran','Bohol','09171234596','valeria.flores@lnhs.com','Elena Flores','Carlos Flores','999 Luna St','Driver','Vendor',130000.00,2,'High School','High School','09181234596','09191234596',NULL,NULL,NULL,NULL,NULL,2,NULL,'09171234597','active','unarchive',NULL,NULL,NULL,'Elena Flores'),(21,'133423847259','Santiago','Villanueva','Luis','8','2007-03-14','Male',17,'101 Aguinaldo St','Barangay Diez','Tagbilaran','Bohol','09171234598','luis.santiago@lnhs.com','Rosa Santiago','Juan Santiago','101 Aguinaldo St','Mechanic','Nurse',140000.00,4,'College','College','09181234598','09191234598',NULL,NULL,NULL,NULL,NULL,2,NULL,'09171234599','active','unarchive',NULL,NULL,NULL,'Rosa Santiago'),(22,'133423847260','Aguilar','Santos','Jasmine','9','2006-06-12','Female',18,'201 Mabini St','Barangay Dos','Tagbilaran','Bohol','09171234600','jasmine.aguilar@lnhs.com','Luz Aguilar','Jose Aguilar','201 Mabini St','Driver','Vendor',50000.00,2,'High School','College','09181234600','09191234600',NULL,NULL,NULL,NULL,NULL,3,NULL,'09171234601','active','unarchive',NULL,NULL,NULL,'Luz Aguilar'),(23,'133423847261','Bautista','Lopez','Marco','9','2006-07-15','Male',17,'202 Rizal Ave','Barangay Tres','Tagbilaran','Bohol','09171234602','marco.bautista@lnhs.com','Ana Bautista','Pedro Bautista','202 Rizal Ave','Carpenter','Housewife',60000.00,3,'College','High School','09181234602','09191234602',NULL,NULL,NULL,NULL,NULL,3,NULL,'09171234603','active','unarchive',NULL,NULL,NULL,'Ana Bautista'),(24,'133423847262','Cabrera','Torres','Nicole','9','2006-08-20','Female',17,'203 Bonifacio St','Barangay Uno','Tagbilaran','Bohol','09171234604','nicole.cabrera@lnhs.com','Carmen Cabrera','Luis Cabrera','203 Bonifacio St','Farmer','Teacher',70000.00,1,'College','College','09181234604','09191234604',NULL,NULL,NULL,NULL,NULL,3,NULL,'09171234605','active','unarchive',NULL,NULL,NULL,'Carmen Cabrera'),(25,'133423847263','Domingo','Santos','Rafael','9','2006-09-10','Male',17,'204 Luna St','Barangay Quatro','Tagbilaran','Bohol','09171234606','rafael.domingo@lnhs.com','Elena Domingo','Carlos Domingo','204 Luna St','Driver','Vendor',80000.00,2,'High School','High School','09181234606','09191234606',NULL,NULL,NULL,NULL,NULL,3,NULL,'09171234607','active','unarchive',NULL,NULL,NULL,'Elena Domingo'),(26,'133423847264','Escobar','Cruz','Samantha','9','2006-10-05','Female',17,'205 Aguinaldo St','Barangay Cinco','Tagbilaran','Bohol','09171234608','samantha.escobar@lnhs.com','Rosa Escobar','Juan Escobar','205 Aguinaldo St','Mechanic','Nurse',90000.00,4,'College','College','09181234608','09191234608',NULL,NULL,NULL,NULL,NULL,3,NULL,'09171234609','active','unarchive',NULL,NULL,NULL,'Rosa Escobar'),(27,'133423847265','Fernandez','Garcia','Victor','9','2006-11-22','Male',17,'206 Mabini St','Barangay Seis','Tagbilaran','Bohol','09171234610','victor.fernandez@lnhs.com','Maria Fernandez','Jose Fernandez','206 Mabini St','Driver','Vendor',100000.00,2,'High School','High School','09181234610','09191234610',NULL,NULL,NULL,NULL,NULL,3,NULL,'09171234611','active','unarchive',NULL,NULL,NULL,'Maria Fernandez'),(28,'133423847266','Gomez','Dela Cruz','Bianca','9','2006-12-30','Female',17,'207 Rizal Ave','Barangay Siete','Tagbilaran','Bohol','09171234612','bianca.gomez@lnhs.com','Ana Gomez','Pedro Gomez','207 Rizal Ave','Carpenter','Housewife',110000.00,3,'College','High School','09181234612','09191234612',NULL,NULL,NULL,NULL,NULL,3,NULL,'09171234613','active','archived',NULL,NULL,NULL,'Ana Gomez'),(29,'133423847267','Hernandez','Mendoza','Miguel','9','2006-01-18','Male',18,'208 Bonifacio St','Barangay Ocho','Tagbilaran','Bohol','09171234614','miguel.hernandez@lnhs.com','Carmen Hernandez','Luis Hernandez','208 Bonifacio St','Farmer','Teacher',120000.00,1,'College','College','09181234614','09191234614',NULL,NULL,NULL,NULL,NULL,3,NULL,'09171234615','active','unarchive',NULL,NULL,NULL,'Carmen Hernandez'),(30,'133423847268','Ibarra','Reyes','Sofia','9','2006-02-25','Female',18,'209 Luna St','Barangay Nueve','Tagbilaran','Bohol','09171234616','sofia.ibarra@lnhs.com','Elena Ibarra','Carlos Ibarra','209 Luna St','Driver','Vendor',130000.00,2,'High School','High School','09181234616','09191234616',NULL,NULL,NULL,NULL,NULL,3,NULL,'09171234617','active','unarchive',NULL,NULL,NULL,'Elena Ibarra'),(31,'133423847269','Jimenez','Villanueva','Andres','9','2006-03-14','Male',18,'210 Aguinaldo St','Barangay Diez','Tagbilaran','Bohol','09171234618','andres.jimenez@lnhs.com','Rosa Jimenez','Juan Jimenez','210 Aguinaldo St','Mechanic','Nurse',140000.00,4,'College','College','09181234618','09191234618',NULL,NULL,NULL,NULL,NULL,3,NULL,'09171234619','active','unarchive',NULL,NULL,NULL,'Rosa Jimenez'),(32,'133423847270','Luna','Santos','Clarissa','10','2005-06-12','Female',19,'301 Mabini St','Barangay Dos','Tagbilaran','Bohol','09171234620','clarissa.luna@lnhs.com','Luz Luna','Jose Luna','301 Mabini St','Driver','Vendor',50000.00,2,'High School','College','09181234620','09191234620',NULL,NULL,NULL,NULL,NULL,4,NULL,'09171234621','active','archived',NULL,NULL,NULL,'Luz Luna'),(33,'133423847271','Mendoza','Lopez','Oscar','10','2005-07-15','Male',18,'302 Rizal Ave','Barangay Tres','Tagbilaran','Bohol','09171234622','oscar.mendoza@lnhs.com','Ana Mendoza','Pedro Mendoza','302 Rizal Ave','Carpenter','Housewife',60000.00,3,'College','High School','09181234622','09191234622',NULL,NULL,NULL,NULL,NULL,4,NULL,'09171234623','active','unarchive',NULL,NULL,NULL,'Ana Mendoza'),(34,'133423847272','Nieves','Torres','Regina','10','2005-08-20','Female',18,'303 Bonifacio St','Barangay Uno','Tagbilaran','Bohol','09171234624','regina.nieves@lnhs.com','Carmen Nieves','Luis Nieves','303 Bonifacio St','Farmer','Teacher',70000.00,1,'College','College','09181234624','09191234624',NULL,NULL,NULL,NULL,NULL,4,NULL,'09171234625','active','unarchive',NULL,NULL,NULL,'Carmen Nieves'),(35,'133423847273','Ocampo','Santos','Samuel','10','2005-09-10','Male',18,'304 Luna St','Barangay Quatro','Tagbilaran','Bohol','09171234626','samuel.ocampo@lnhs.com','Elena Ocampo','Carlos Ocampo','304 Luna St','Driver','Vendor',80000.00,2,'High School','High School','09181234626','09191234626',NULL,NULL,NULL,NULL,NULL,4,NULL,'09171234627','active','archived',NULL,NULL,NULL,'Elena Ocampo'),(36,'133423847274','Pascual','Cruz','Teresa','10','2005-10-05','Female',18,'305 Aguinaldo St','Barangay Cinco','Tagbilaran','Bohol','09171234628','teresa.pascual@lnhs.com','Rosa Pascual','Juan Pascual','305 Aguinaldo St','Mechanic','Nurse',90000.00,4,'College','College','09181234628','09191234628',NULL,NULL,NULL,NULL,NULL,4,NULL,'09171234629','active','unarchive',NULL,NULL,NULL,'Rosa Pascual'),(37,'133423847275','Quinto','Garcia','Tomas','10','2005-11-22','Male',18,'306 Mabini St','Barangay Seis','Tagbilaran','Bohol','09171234630','tomas.quinto@lnhs.com','Maria Quinto','Jose Quinto','306 Mabini St','Driver','Vendor',100000.00,2,'High School','High School','09181234630','09191234630',NULL,NULL,NULL,NULL,NULL,4,NULL,'09171234631','active','unarchive',NULL,NULL,NULL,'Maria Quinto'),(38,'133423847276','Rivera','Dela Cruz','Ursula','10','2005-12-30','Female',18,'307 Rizal Ave','Barangay Siete','Tagbilaran','Bohol','09171234632','ursula.rivera@lnhs.com','Ana Rivera','Pedro Rivera','307 Rizal Ave','Carpenter','Housewife',110000.00,3,'College','High School','09181234632','09191234632',NULL,NULL,NULL,NULL,NULL,4,NULL,'09171234633','active','unarchive',NULL,NULL,NULL,'Ana Rivera'),(39,'133423847277','Salazar','Mendoza','Vicente','10','2005-01-18','Male',19,'308 Bonifacio St','Barangay Ocho','Tagbilaran','Bohol','09171234634','vicente.salazar@lnhs.com','Carmen Salazar','Luis Salazar','308 Bonifacio St','Farmer','Teacher',120000.00,1,'College','College','09181234634','09191234634',NULL,NULL,NULL,NULL,NULL,4,NULL,'09171234635','active','archived',NULL,NULL,NULL,'Carmen Salazar'),(40,'133423847278','Torre','Reyes','Wendy','10','2005-02-25','Female',19,'309 Luna St','Barangay Nueve','Tagbilaran','Bohol','09171234636','wendy.torre@lnhs.com','Elena Torre','Carlos Torre','309 Luna St','Driver','Vendor',130000.00,2,'High School','High School','09181234636','09191234636',NULL,NULL,NULL,NULL,NULL,4,NULL,'09171234637','active','archived',NULL,NULL,NULL,'Elena Torre'),(41,'133423847279','Urbano','Villanueva','Xavier','10','2005-03-14','Male',19,'310 Aguinaldo St','Barangay Diez','Tagbilaran','Bohol','09171234638','xavier.urbano@lnhs.com','Rosa Urbano','Juan Urbano','310 Aguinaldo St','Mechanic','Nurse',140000.00,4,'College','College','09181234638','09191234638',NULL,NULL,NULL,NULL,NULL,4,NULL,'09171234639','inactive','archived',NULL,NULL,NULL,'Rosa Urbano');

/*Table structure for table `student_elective` */

DROP TABLE IF EXISTS `student_elective`;

CREATE TABLE `student_elective` (
  `student_elective_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `elective_id` int(11) DEFAULT NULL,
  `enrollment_status` enum('pending','approved','rejected') DEFAULT 'pending',
  `student_id` int(11) DEFAULT NULL,
  `grade_level` int(11) DEFAULT NULL,
  `school_year_id` int(11) DEFAULT NULL,
  `section_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`student_elective_id`),
  KEY `elective_id` (`elective_id`),
  KEY `student_elective_ibfk_1` (`user_id`),
  KEY `student_elective_ibfk_3` (`student_id`),
  CONSTRAINT `student_elective_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `student` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `student_elective` */

/*Table structure for table `student_school_year` */

DROP TABLE IF EXISTS `student_school_year`;

CREATE TABLE `student_school_year` (
  `student_school_year_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `school_year_id` int(11) NOT NULL,
  `status` enum('active','inactive','pending') NOT NULL,
  `student_name` varchar(255) DEFAULT NULL,
  `grade_level` int(11) DEFAULT NULL,
  PRIMARY KEY (`student_school_year_id`),
  KEY `student_id` (`student_id`),
  KEY `school_year_id` (`school_year_id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8;

/*Data for the table `student_school_year` */

insert  into `student_school_year`(`student_school_year_id`,`student_id`,`school_year_id`,`status`,`student_name`,`grade_level`) values (1,1,1,'active','Athrian Judd J. Pahang',7),(2,2,1,'active','Maria Clara Reyes Santos',7),(3,3,1,'active','Juan Lopez Dela Cruz',7),(4,4,1,'active','Josefina Torres Garcia',7),(5,5,1,'active','Miguel Santos Reyes',7),(6,6,1,'active','Andrea Cruz Mendoza',7),(7,7,1,'active','Carlos Garcia Torres',7),(8,8,1,'active','Sofia Dela Cruz Lopez',7),(9,9,1,'active','Gabriel Mendoza Cruz',7),(10,10,1,'active','Isabella Reyes Villanueva',7),(11,11,1,'active','Daniel Villanueva Ramos',7),(12,12,1,'active','Angela Santos Morales',8),(13,13,1,'active','Roberto Lopez Castro',8),(14,14,1,'active','Patricia Torres Navarro',8),(15,15,1,'active','Enrique Santos Ramos',8),(16,16,1,'active','Monica Cruz Gutierrez',8),(17,17,1,'active','Francisco Garcia Silva',8),(18,18,1,'active','Camila Dela Cruz Ortiz',8),(19,19,1,'active','Diego Mendoza Perez',8),(20,20,1,'active','Valeria Reyes Flores',8),(21,21,1,'active','Luis Villanueva Santiago',8),(22,22,1,'active','Jasmine Santos Aguilar',9),(23,23,1,'active','Marco Lopez Bautista',9),(24,24,1,'active','Nicole Torres Cabrera',9),(25,25,1,'active','Rafael Santos Domingo',9),(26,26,1,'active','Samantha Cruz Escobar',9),(27,27,1,'active','Victor Garcia Fernandez',9),(28,28,1,'active','Bianca Dela Cruz Gomez',9),(29,29,1,'active','Miguel Mendoza Hernandez',9),(30,30,1,'active','Sofia Reyes Ibarra',9),(31,31,1,'active','Andres Villanueva Jimenez',9),(32,32,1,'active','Clarissa Santos Luna',10),(33,33,1,'active','Oscar Lopez Mendoza',10),(34,34,1,'active','Regina Torres Nieves',10),(35,35,1,'active','Samuel Santos Ocampo',10),(36,36,1,'active','Teresa Cruz Pascual',10),(37,37,1,'active','Tomas Garcia Quinto',10),(38,38,1,'active','Ursula Dela Cruz Rivera',10),(39,39,1,'active','Vicente Mendoza Salazar',10),(40,40,1,'active','Wendy Reyes Torre',10),(41,41,1,'active','Xavier Villanueva Urbano',10);

/*Table structure for table `subject` */

DROP TABLE IF EXISTS `subject`;

CREATE TABLE `subject` (
  `subject_id` int(11) NOT NULL AUTO_INCREMENT,
  `grade_level` int(11) DEFAULT NULL,
  `subject_name` varchar(50) DEFAULT NULL,
  `status` varchar(8) DEFAULT NULL,
  `grading_criteria` varchar(255) DEFAULT NULL,
  `description` text,
  `archive_status` enum('archive','unarchive') NOT NULL DEFAULT 'unarchive',
  `school_year_id` int(11) NOT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `elective` enum('Y','N') NOT NULL DEFAULT 'N',
  `max_capacity` int(35) DEFAULT NULL,
  PRIMARY KEY (`subject_id`),
  KEY `fk_subject_school_year_id` (`school_year_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;

/*Data for the table `subject` */

insert  into `subject`(`subject_id`,`grade_level`,`subject_name`,`status`,`grading_criteria`,`description`,`archive_status`,`school_year_id`,`employee_id`,`elective`,`max_capacity`) values (1,7,'English 7','active',NULL,'English for grade 7','unarchive',1,NULL,'N',NULL),(2,7,'Math 7','active',NULL,'Mathematics for grade 7','unarchive',1,NULL,'N',NULL),(3,8,'English 8','active',NULL,'English for grade 8','unarchive',1,NULL,'N',NULL),(4,8,'Math 8','active',NULL,'Mathematics for grade 8','unarchive',1,NULL,'N',NULL),(5,9,'English 9','active',NULL,'English for grade 9','unarchive',1,NULL,'N',NULL),(6,9,'Math 9','active',NULL,'Mathematics for grade 9','unarchive',1,NULL,'N',NULL),(7,10,'English 10','active',NULL,'English for grade 10','unarchive',1,NULL,'N',NULL),(8,10,'Math 10','active',NULL,'Mathematics for grade 10','unarchive',1,NULL,'N',NULL);

/*Table structure for table `subject_assigned` */

DROP TABLE IF EXISTS `subject_assigned`;

CREATE TABLE `subject_assigned` (
  `subjectcoordinator_assigned_id` int(11) NOT NULL AUTO_INCREMENT,
  `subject_id` int(11) DEFAULT NULL,
  `employee_id` int(11) NOT NULL,
  `school_year_id` int(11) NOT NULL,
  PRIMARY KEY (`subjectcoordinator_assigned_id`),
  UNIQUE KEY `subject_assigned_id` (`subjectcoordinator_assigned_id`),
  UNIQUE KEY `unique_subject_id` (`subject_id`),
  UNIQUE KEY `subject_id` (`subject_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Data for the table `subject_assigned` */

/*Table structure for table `teacher_subject` */

DROP TABLE IF EXISTS `teacher_subject`;

CREATE TABLE `teacher_subject` (
  `subject_assigned_id` int(11) NOT NULL AUTO_INCREMENT,
  `subject_id` int(11) DEFAULT NULL,
  `level` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `elective` int(11) NOT NULL,
  `school_year_id` int(11) NOT NULL,
  PRIMARY KEY (`subject_assigned_id`),
  UNIQUE KEY `unique_subject_id` (`subject_id`),
  UNIQUE KEY `subject_id` (`subject_id`),
  UNIQUE KEY `unique_teacher_subject` (`subject_id`,`section_id`,`employee_id`,`school_year_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;

/*Data for the table `teacher_subject` */

insert  into `teacher_subject`(`subject_assigned_id`,`subject_id`,`level`,`section_id`,`employee_id`,`elective`,`school_year_id`) values (1,1,7,1,8,0,1),(2,2,7,1,2,0,1),(3,3,8,2,8,0,1),(4,4,8,2,2,0,1),(5,5,9,3,8,0,1),(6,6,9,3,2,0,1),(7,7,10,4,8,0,1),(8,8,10,4,2,0,1);

/*Table structure for table `users` */

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` int(11) DEFAULT NULL,
  `role_name` varchar(255) DEFAULT NULL,
  `password1` varchar(100) DEFAULT NULL,
  `other_role_name` varchar(200) DEFAULT NULL,
  `profile_picture_url` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  KEY `fk_users_role_name` (`role_name`),
  KEY `fk_role_in_users` (`role_id`),
  CONSTRAINT `fk_role_in_users` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_users_role_name` FOREIGN KEY (`role_name`) REFERENCES `roles` (`role_name`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8;

/*Data for the table `users` */

insert  into `users`(`user_id`,`username`,`password`,`role_id`,`role_name`,`password1`,`other_role_name`,`profile_picture_url`) values (1,'admin','adminpass',1,'principal',NULL,NULL,NULL),(2,'dante_r@lnhs.com','dantepass',1,'principal',NULL,'subject_teacher','http://localhost:3001/uploads/profile-pictures/user_5.jpg'),(3,'zane_y@lnhs.com','zanepass',3,'subject_teacher',NULL,NULL,'http://localhost:3001/uploads/profile-pictures/user_6.jpg'),(4,'john_d@lnhs.com','johnpass',4,'class_adviser',NULL,NULL,'http://localhost:3001/uploads/profile-pictures/user_7.jpg'),(5,'jane_s@lnhs.com','janepass',5,'grade_level_coordinator',NULL,NULL,'http://localhost:3001/uploads/profile-pictures/user_8.jpg'),(6,'alice_j@lnhs.com','alicepass',6,'registrar',NULL,NULL,'http://localhost:3001/uploads/profile-pictures/user_9.jpg'),(7,'emily_b@lnhs.com','emilypass',7,'academic_coordinator',NULL,'subject_teacher','http://localhost:3001/uploads/profile-pictures/user_10.jpg'),(8,'michael_w@lnhs.com','michaelpass',8,'subject_coordinator',NULL,'subject_teacher','http://localhost:3001/uploads/profile-pictures/user_11.jpg'),(9,'pahang.athrian_judd@lnhs.com','1234',2,'student',NULL,NULL,NULL),(10,'santos.maria_clara@lnhs.com','1234',2,'student',NULL,NULL,NULL),(11,'delacruz.juan@lnhs.com','1234',2,'student',NULL,NULL,NULL),(12,'garcia.josefina@lnhs.com','1234',2,'student',NULL,NULL,NULL),(13,'reyes.miguel@lnhs.com','1234',2,'student',NULL,NULL,NULL),(14,'mendoza.andrea@lnhs.com','1234',2,'student',NULL,NULL,NULL),(15,'torres.carlos@lnhs.com','1234',2,'student',NULL,NULL,NULL),(16,'lopez.sofia@lnhs.com','1234',2,'student',NULL,NULL,NULL),(17,'cruz.gabriel@lnhs.com','1234',2,'student',NULL,NULL,NULL),(18,'villanueva.isabella@lnhs.com','1234',2,'student',NULL,NULL,NULL),(19,'ramos.daniel@lnhs.com','1234',2,'student',NULL,NULL,NULL),(20,'morales.angela@lnhs.com','1234',2,'student',NULL,NULL,NULL),(21,'castro.roberto@lnhs.com','1234',2,'student',NULL,NULL,NULL),(22,'navarro.patricia@lnhs.com','1234',2,'student',NULL,NULL,NULL),(23,'ramos.enrique@lnhs.com','1234',2,'student',NULL,NULL,NULL),(24,'gutierrez.monica@lnhs.com','1234',2,'student',NULL,NULL,NULL),(25,'silva.francisco@lnhs.com','1234',2,'student',NULL,NULL,NULL),(26,'ortiz.camila@lnhs.com','1234',2,'student',NULL,NULL,NULL),(27,'perez.diego@lnhs.com','1234',2,'student',NULL,NULL,NULL),(28,'flores.valeria@lnhs.com','1234',2,'student',NULL,NULL,NULL),(29,'santiago.luis@lnhs.com','1234',2,'student',NULL,NULL,NULL),(30,'aguilar.jasmine@lnhs.com','1234',2,'student',NULL,NULL,NULL),(31,'bautista.marco@lnhs.com','1234',2,'student',NULL,NULL,NULL),(32,'cabrera.nicole@lnhs.com','1234',2,'student',NULL,NULL,NULL),(33,'domingo.rafael@lnhs.com','1234',2,'student',NULL,NULL,NULL),(34,'escobar.samantha@lnhs.com','1234',2,'student',NULL,NULL,NULL),(35,'fernandez.victor@lnhs.com','1234',2,'student',NULL,NULL,NULL),(36,'gomez.bianca@lnhs.com','1234',2,'student',NULL,NULL,NULL),(37,'hernandez.miguel@lnhs.com','1234',2,'student',NULL,NULL,NULL),(38,'ibarra.sofia@lnhs.com','1234',2,'student',NULL,NULL,NULL),(39,'jimenez.andres@lnhs.com','1234',2,'student',NULL,NULL,NULL),(40,'luna.clarissa@lnhs.com','1234',2,'student',NULL,NULL,NULL),(41,'mendoza.oscar@lnhs.com','1234',2,'student',NULL,NULL,NULL),(42,'nieves.regina@lnhs.com','1234',2,'student',NULL,NULL,NULL),(43,'ocampo.samuel@lnhs.com','1234',2,'student',NULL,NULL,NULL),(44,'pascual.teresa@lnhs.com','1234',2,'student',NULL,NULL,NULL),(45,'quinto.tomas@lnhs.com','1234',2,'student',NULL,NULL,NULL),(46,'rivera.ursula@lnhs.com','1234',2,'student',NULL,NULL,NULL),(47,'salazar.vicente@lnhs.com','1234',2,'student',NULL,NULL,NULL),(48,'torre.wendy@lnhs.com','1234',2,'student',NULL,NULL,NULL),(49,'urbano.xavier@lnhs.com','1234',2,'student',NULL,NULL,NULL),(50,'dumayac.anton@lnhs.com','1234',3,'subject_teacher','7110eda4d09e062aa5e4a390b0a572ac0d2c0220',NULL,NULL);

/*!50106 set global event_scheduler = 1*/;

/* Event structure for event `update_student_status_event` */

/*!50106 DROP EVENT IF EXISTS `update_student_status_event`*/;

DELIMITER $$

/*!50106 CREATE DEFINER=`root`@`localhost` EVENT `update_student_status_event` ON SCHEDULE EVERY 1 DAY STARTS '2024-06-25 04:14:44' ON COMPLETION NOT PRESERVE ENABLE DO CALL update_student_status('2023-2024') */$$
DELIMITER ;

/* Function  structure for function  `ProperCase` */

/*!50003 DROP FUNCTION IF EXISTS `ProperCase` */;
DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` FUNCTION `ProperCase`(str TEXT) RETURNS text CHARSET utf8
    DETERMINISTIC
BEGIN
  DECLARE i INT DEFAULT 1;
  DECLARE result TEXT DEFAULT '';
  DECLARE c CHAR(1);
  DECLARE capitalizeNext BOOLEAN DEFAULT TRUE;
  WHILE i <= CHAR_LENGTH(str) DO
    SET c = SUBSTRING(str, i, 1);
    IF capitalizeNext AND c REGEXP '[a-zA-Z]' THEN
      SET result = CONCAT(result, UPPER(c));
      SET capitalizeNext = FALSE;
    ELSE
      SET result = CONCAT(result, LOWER(c));
      IF c = ' ' THEN
        SET capitalizeNext = TRUE;
      END IF;
    END IF;
    SET i = i + 1;
  END WHILE;
  RETURN result;
END */$$
DELIMITER ;

/* Procedure structure for procedure `update_student_status` */

/*!50003 DROP PROCEDURE IF EXISTS  `update_student_status` */;

DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`localhost` PROCEDURE `update_student_status`(IN school_year VARCHAR(50))
BEGIN
  -- Activate students
  UPDATE student s
  JOIN enrollment e ON s.student_id = e.student_id
  JOIN school_year sy ON e.enrollment_date BETWEEN sy.enrollment_start AND sy.enrollment_end
  SET s.student_status = 'active'
  WHERE sy.school_year = school_year;
  -- Deactivate students
  UPDATE student s
  LEFT JOIN (
    SELECT e.student_id
    FROM enrollment e
    JOIN school_year sy ON e.enrollment_date BETWEEN sy.enrollment_start AND sy.enrollment_end
    WHERE sy.school_year = school_year
  ) active_students ON s.student_id = active_students.student_id
  SET s.student_status = 'inactive'
  WHERE active_students.student_id IS NULL;
END */$$
DELIMITER ;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
