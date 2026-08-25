import multer from "multer";
import path from "path";

// ⚙️ Storage config
const storage = multer.diskStorage({
  // 📂 Set upload destination
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },

  // 🏷 Generate unique filename
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || ".png"; // fallback if no extension
    const uniqueName = `${file.fieldname}-${Date.now()}-${Math.floor(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// ✅ Final upload middleware
export const upload = multer({
  storage,
   
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only .png, .jpg and .jpeg files are allowed"));
    }
  },

});
