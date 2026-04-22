import { Student } from "../models/Student.js";

export async function getStudents(_req, res) {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function createStudent(req, res) {
  try {
    const { name, email, course } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "name and email are required" });
    }

    const student = await Student.create({ name, email, course });
    return res.status(201).json(student);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
