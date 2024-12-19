const path = require('path');
const fs = require('fs');


exports.deleteFile = async (oldImagePath) => {
    try {
        const fullPath = path.join(__dirname, '../', oldImagePath);
        console.log(fullPath);
        if (fs.existsSync(fullPath)) {
            fs.unlink(fullPath, (err) => {
                if (err) {
                    console.error(`Error deleting old image: ${err}`);
                } else {
                    console.log(`Successfully deleted old image: ${fullPath}`);
                }
            });
        } else {
            console.error(`Old image file does not exist: ${fullPath}`);
        }
    }
    catch (error) {
        console.error(`Error deleting old image: ${error}`);
    }
};

exports.handleFileUpload = async (file, destination) => {
    if (!file) return null;
    const extension = path.extname(file.name);
    const filename = `${Date.now()}${extension}`;
    const uploadPath = path.join(__dirname, "..", "uploads", destination, filename);
    try {
        await file.mv(uploadPath);
        console.log(`File uploaded to ${uploadPath}`);
        return `/uploads/${destination}/${filename}`;
    } catch (err) {
        console.error(`Error uploading file: ${err}`);
        return null;
    }
};
