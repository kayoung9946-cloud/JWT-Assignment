// FE-01: 토큰 메모리 보관
let memoryToken = null;

export function setToken(token) {
  memoryToken = token;
}

export function getToken() {
  return memoryToken;
}

export function clearToken() {
  memoryToken = null;
}

/**
 * main.jsx:25 `setUser(getSession().user)` 에러 방지용 함수
 * 토큰 유무에 따른 유저 정보 객체 제공
 */
export function getSession() {
  if (!memoryToken) {
    return { token: null, user: null };
  }
  try {
    const payloadBase64 = memoryToken.split('.')[1];
    const decoded = JSON.parse(atob(payloadBase64));
    return { token: memoryToken, user: decoded };
  } catch (e) {
    return { token: memoryToken, user: null };
  }
}

export const clearSession = clearToken;
export const setSession = setToken;

/**
 * FE-02 & FE-03: 기본 API 요청 함수
 */
export async function apiRequest(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (memoryToken) {
    headers["Authorization"] = `Bearer ${memoryToken}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    clearToken();
  }

  return response;
}

/**
 * 게시글 목록 조회
 */
export async function getPosts() {
  try {
    const res = await apiRequest("/api/posts");
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.posts)) return data.posts;
    return [];
  } catch (err) {
    return [];
  }
}

/**
 * 게시글 단건 상세 조회 (main.jsx api.detail 대응)
 */
export async function getPostDetail(id) {
  try {
    const res = await apiRequest(`/api/posts/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

/**
 * 로그인
 */
export async function login(email, password) {
  try {
    const res = await apiRequest("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok && data.token) {
      setToken(data.token);
    }
    return data;
  } catch (err) {
    return null;
  }
}

export async function logout() {
  clearToken();
  return { ok: true };
}

/**
 * 내 정보 조회
 */
export async function getMe() {
  try {
    const res = await apiRequest("/api/me");
    if (!res.ok) return { name: "알 수 없음", email: "" };
    return await res.json();
  } catch (err) {
    return { name: "알 수 없음", email: "" };
  }
}

export async function createPost(postData) {
  try {
    const res = await apiRequest("/api/posts", {
      method: "POST",
      body: JSON.stringify(postData),
    });
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function updatePost(id, postData) {
  try {
    const res = await apiRequest(`/api/posts/${id}`, {
      method: "PUT",
      body: JSON.stringify(postData),
    });
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function deletePost(id) {
  try {
    const res = await apiRequest(`/api/posts/${id}`, {
      method: "DELETE",
    });
    return await res.json();
  } catch (err) {
    return null;
  }
}

// main.jsx용 alias
export const list = getPosts;
export const detail = getPostDetail;
export const me = getMe;
export const create = createPost;
export const update = updatePost;
export const remove = deletePost;

/**
 * 작성자 권한 체크 헬퍼
 */
export function canEdit(post) {
  if (!post) return false;
  const session = getSession();
  if (!session.user) return false;
  return session.user.id === post.authorId || session.user.email === post.authorEmail;
}

// main.jsx용 api 객체 내보내기
export const api = {
  request: apiRequest,
  setToken,
  getToken,
  clearToken,
  getSession,
  clearSession,
  setSession,
  login,
  logout,
  getMe,
  getPosts,
  getPostDetail,
  createPost,
  updatePost,
  deletePost,
  list: getPosts,
  detail: getPostDetail,
  me: getMe,
  create: createPost,
  update: updatePost,
  remove: deletePost,
  canEdit,
};

export default api;