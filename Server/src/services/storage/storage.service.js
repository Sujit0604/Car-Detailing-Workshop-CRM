const fs = require("fs/promises");

const localStorage =
    require("./local.storage");

const cloudinaryStorage =
    require("./cloudinary.storage");


const uploadToBoth = async ({
    file,
    userId,
}) => {

    let localResult = null;
    let cloudinaryResult = null;


    try {

        // -------------------------
        // 1. Save to local server
        // -------------------------

        localResult =
            await localStorage.saveFile(
                file,
                userId
            );


        // -------------------------
        // 2. Upload to Cloudinary
        // -------------------------

        cloudinaryResult =
            await cloudinaryStorage.uploadFile(
                file,
                userId
            );


        // -------------------------
        // 3. Both succeeded
        // -------------------------

        return {
            local: localResult,

            cloudinary:
                cloudinaryResult,
        };


    } catch (error) {

        console.error(
            "Dual storage upload failed:",
            error.message
        );


        // -------------------------
        // Cleanup local copy
        // -------------------------

        if (localResult?.path) {

            try {

                await localStorage.deleteFile(
                    localResult.path
                );

            } catch (cleanupError) {

                console.error(
                    "Local cleanup failed:",
                    cleanupError.message
                );
            }
        }


        // -------------------------
        // Cleanup Cloudinary copy
        // -------------------------

        if (
            cloudinaryResult?.publicId
        ) {

            try {

                await cloudinaryStorage.deleteFile(
                    cloudinaryResult.publicId,

                    cloudinaryResult.resourceType
                );

            } catch (cleanupError) {

                console.error(
                    "Cloudinary cleanup failed:",
                    cleanupError.message
                );
            }
        }


        throw error;

    } finally {

        // -------------------------
        // Always remove temp file
        // -------------------------

        if (file?.path) {

            try {

                await fs.unlink(
                    file.path
                );

            } catch (cleanupError) {

                if (
                    cleanupError.code !==
                    "ENOENT"
                ) {

                    console.error(
                        "Temp file cleanup failed:",
                        cleanupError.message
                    );
                }
            }
        }
    }
};


module.exports = {
    uploadToBoth,
};
