import axios from "axios";

export const getAddresses = async () => {
  const res = await axios.get("/api/me/address");
  return res.data;
};

export const createAddress = async (data: any) => {
  const res = await axios.post("/api/me/address", data);
  return res.data;
};

export const updateAddress = async (id: string, data: any) => {
  const res = await axios.patch(`/api/me/address/${id}`, data);
  return res.data;
};

export const deleteAddress = async (id: string) => {
  const res = await axios.delete(`/api/me/address/${id}`);
  return res.data;
};

export const setDefaultAddress = async (id: string) => {
  const res = await axios.patch(`/api/me/address/${id}/default`);
  return res.data;
};
