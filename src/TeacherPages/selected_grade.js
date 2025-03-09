import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const StudentGrades = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const studentName = searchParams.get("student");

    const [grades, setGrades] = useState([]);

    useEffect(() => {
        if (studentName) {
            fetch(`/api/grades?student=${encodeURIComponent(studentName)}`)
                .then((res) => res.json())
                .then((data) => setGrades(data))
                .catch((err) => console.error("Error fetching grades:", err));
        }
    }, [studentName]);

    return (
        <div className="grades-container">
            <h2>{studentName}'s Grades</h2>
            <table className="grades-table">
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>Grade</th>
                    </tr>
                </thead>
                <tbody>
                    {grades.length > 0 ? (
                        grades.map((grade, index) => (
                            <tr key={index}>
                                <td>{grade.subject}</td>
                                <td>{grade.grade}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="2">No grades found</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default StudentGrades;
