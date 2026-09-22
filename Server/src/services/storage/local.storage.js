const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const uploadDir = path.join(
    process.cwd(),
    "uploads",
    "files"
);


const saveFile = async (tempFile, userId) => {

    const userDirectory = path.join(
        uploadDir,
        userId.toString()
    );

    await fs.mkdir(userDirectory, {
        recursive: true,
    });


    const extension = path.extname(
        tempFile.originalname
    );

    const storedName =
        `${crypto.randomUUID()}${extension}`;


    const destination = path.join(
        userDirectory,
        storedName
    );


    await fs.copyFile(
        tempFile.path,
        destination
    );


    return {
        storedName,

        path: destination,
    };
};


const deleteFile = async (filePath) => {

    try {

        await fs.unlink(filePath);

    } catch (error) {

        if (error.code !== "ENOENT") {
            throw error;
        }
    }
};


module.exports = {
    saveFile,
    deleteFile,
};
