import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

// // --- Request Interceptor ---
// api.interceptors.request.use((config) => {
//   // Her istekte Authorization header ekle (eğer varsa)
//   const token = localStorage.getItem('accessToken')
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`
//   }
//   return config
// })

// // --- Response Interceptor ---
// api.interceptors.response.use(
//   (response) => response, // başarılıysa direkt dön
//   async (error) => {
//     const originalRequest = error.config

//     // 401 + token refresh yapmadıysak
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true

//       try {
//         // Refresh token ile yeni access token al
//         const { data } = await axios.post('/auth/refresh', {}, { withCredentials: true })
//         localStorage.setItem('accessToken', data.accessToken)

//         // Orijinal isteği yeni token ile tekrar dene
//         originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
//         return api(originalRequest)
//       } catch (refreshError) {
//         // Refresh de başarısızsa logout
//         localStorage.removeItem('accessToken')
//         window.location.href = '/login'
//         return Promise.reject(refreshError)
//       }
//     }

//     // Error normalization: Her hatayı standart formata çevir
//     const normalizedError = {
//       message: error.response?.data?.message || error.message,
//       status: error.response?.status,
//       code: error.response?.data?.code || 'UNKNOWN_ERROR',
//     }

//     return Promise.reject(normalizedError)
//   },
// )

export default api
