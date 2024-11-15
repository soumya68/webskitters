const express = require("express");
const multer = require("multer");
const csvParser = require("csv-parser");
const fs = require("fs");
const mongoose = require("mongoose");
const Question = require("../models/questionsModel"); 
const Category = require("../models/catagoriesModel"); 
const User = require("../models/User"); 

const router = express.Router();


const upload = multer({ dest: "uploads/" });


router.post("/upload", upload.single("csvFile"), async (req, res) => {
  const filePath = req.file.path;

  try {
    const categoriesMap = await getCategoriesMap(); 
    const user = await User.findOne({ username: "admin" }); 

    const questions = [];

    
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", async (row) => {
        try {
          const { text, options, correctAnswers, categoryNames } = row;

          
          const categoryIds = await mapCategories(categoryNames, categoriesMap);
          if (!categoryIds || categoryIds.length === 0) {
            throw new Error("Invalid categories");
          }

          
          const question = {
            text,
            categories: categoryIds,
            createdBy: user._id,
            options: parseOptions(options),
            correctAnswers: parseCorrectAnswers(correctAnswers),
          };

          questions.push(question);
        } catch (err) {
          console.error("Error processing row:", err);
        }
      })
      .on("end", async () => {
        
        if (questions.length > 0) {
          await Question.insertMany(questions);
          res
            .status(200)
            .json({ message: "Questions added successfully!", questions });
        } else {
          res.status(400).json({ message: "No valid questions found." });
        }

        
        fs.unlinkSync(filePath);
      })
      .on("error", (err) => {
        console.error("Error reading CSV:", err);
        res.status(500).json({ message: "Failed to read CSV file." });
      });
  } catch (err) {
    console.error("Error in file upload:", err);
    res.status(500).json({ message: "Server error during CSV processing." });
  }
});


const getCategoriesMap = async () => {
  const categories = await Category.find({});
  return categories.reduce((map, category) => {
    map[category.name.toLowerCase()] = category._id;
    return map;
  }, {});
};


const mapCategories = async (categoryNames, categoriesMap) => {
  if (!categoryNames) return [];
  const categoryNamesArray = categoryNames
    .split(";")
    .map((name) => name.trim().toLowerCase());
  return categoryNamesArray
    .map((name) => categoriesMap[name])
    .filter((id) => id);
};


const parseOptions = (optionsStr) => {
  const options = optionsStr.split(";").map((optionStr) => {
    const [label, value] = optionStr.split(":");
    return { label: label.trim(), value: value.trim() };
  });
  return options;
};


const parseCorrectAnswers = (correctAnswersStr) => {
  return correctAnswersStr.split(";").map((answer) => answer.trim());
};

module.exports = router;
