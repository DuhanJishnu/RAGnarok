import api  from "./api";

// ================= FILE MANAGEMENT =================

// Upload File
export const uploadFile = async (
  files: File[]
) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const res = await api.post("/file/v1/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// Get Job Status
export const getJobStatus = async (id: string, fileType = "1") => {
  const res = await api.get(`/file/v1/job/${id}?fileType=${fileType}`);
  return res.data;
};

// Get File
export const getFile = async (encryptedId: string) => {
  const res = await api.get(`/file/v1/files/${encryptedId}`, { responseType: "blob" });
  return res.data;
};

// Get Thumbnail
export const getThumbnail = async (encryptedId: string) => {
  const res = await api.get(`/file/v1/thumb/${encryptedId}`, { responseType: "blob" });
  return res.data;
};
