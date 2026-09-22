const cloudinary = require("../../config/cloudinary");


const uploadFile = async (
    tempFile,
    userId
) => {

    const result =
        await cloudinary.uploader.upload(
            tempFile.path,
            {
                folder:
                    `car-detailing-crm/${userId}`,

                resource_type: "auto",
            }
        );


    return {
        publicId: result.public_id,

        url: result.secure_url,

        resourceType:
            result.resource_type,

        format: result.format,

        bytes: result.bytes,
    };
};


const deleteFile = async (
    publicId,
    resourceType
) => {

    if (!publicId) {
        return;
    }


    await cloudinary.uploader.destroy(
        publicId,
        {
            resource_type:
                resourceType || "image",
        }
    );
};


module.exports = {
    uploadFile,
    deleteFile,
};
