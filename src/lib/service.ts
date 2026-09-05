/* eslint-disable @typescript-eslint/no-explicit-any */
// Basic service to be called When calling the backend/API
import request from "./request";

function get(url: string) {
    return request({
        method: "GET",
        url,
    });
}

function post<T = any>({ url, data }: { url?: string; data: T }) {
    return request({
        method: "POST",
        url,
        data,
    });
}

function update(url: any, data: any) {
    return request({
        method: "PUT",
        url,
        data,
    });
}

function remove(url: string) {
    return request({
        method: "DELETE",
        url,
    });
}

function patchdata(url: any, data: any) {
    return request({
        method: "PATCH", // <-- FIX: Changed from PUT to PATCH to match the API route
        url,
        data,
    });
}
export async function postBinary(url: string, data: any) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const ct = r.headers.get("content-type") || "";

  // Always read as Blob so we can sniff or show text later
  const blob = await r.blob();

  return {
    ok: r.ok,
    status: r.status,
    headers: r.headers,
    contentType: ct.toLowerCase(),
    blob,
  };
}

const Service = {
    get,
    post,
    update,
    remove,
    patchdata
};
export default Service;
