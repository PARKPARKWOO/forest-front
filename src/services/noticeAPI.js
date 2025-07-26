
import axios from "./axiosInstance";

export const noticeAPI = {
  getNotices: () => {
    return axios.get("/notice");
  },
  getNotice: (id) => {
    return axios.get(`/notice/${id}`);
  },
};
