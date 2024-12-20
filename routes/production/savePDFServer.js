const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const savePDF = express.Router();

// Global variable to store the adjustment name
let globalAdjustmentName = "Default_Name";

// Ensure upload directory exists
const uploadFolder =
  process.env.FILE_SERVER_PDF_PATH || path.join(__dirname, "uploads");
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}



const getFormattedDateTime = () => {
  const now = new Date();

  // Format date as dd-mm-yyyy
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  // Format time as hh:mm:ss with AM/PM
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // Convert to 12-hour format, replace 0 with 12

  // Return the formatted date and time string
  return `${day}-${month}-${year}_${hours}-${minutes}-${seconds} ${ampm}`;
};
// API to store adjustment name globally

savePDF.post("/set-adjustment-name", (req, res) => {
  const { adjustment } = req.body;

  if (!adjustment) {
    return res.status(400).send({ message: "Adjustment name is required." });
  }

  globalAdjustmentName = adjustment;
  console.log("Global adjustment name set to:", globalAdjustmentName);
  res.status(200).send({ message: "Adjustment name saved successfully." });
});

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder); // Save files in the uploads directory
  },
  filename: (req, file, cb) => {
    const dateTime = getFormattedDateTime(); // Get current date and time
    console.log(" dateTime :", dateTime);
    const ext = path.extname(file.originalname); // Retain the original file extension
    cb(null, `${globalAdjustmentName}_${dateTime}${ext}`); // Use global adjustment name
  },
});
const upload = multer({ storage }).single("file");

// API endpoint to save the PDF
savePDF.post("/save-pdf", (req, res) => {
  // Middleware to handle the file upload
  upload(req, res, (err) => {
    if (err) {
      console.log(" err to:", err);
      return res
        .status(500)
        .send({ message: "File upload failed", error: err });
    }

    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    console.log("Adjustment Name:", globalAdjustmentName); // Log the adjustment name
    console.log(`File saved to: ${req.file.path}`); // Log the file path

    res.status(200).send({
      message: "PDF saved successfully!",
      filePath: req.file.path,
    });
  });
});

module.exports = savePDF;
