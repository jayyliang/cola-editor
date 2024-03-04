import { message } from 'antd'
import axios from 'axios'
export const generateRandomFileName = (file) => {
  return `${window.crypto.randomUUID()}.${file.type.split('/')[1]}`
}
export const UPLOAD_CONFIG = 'UPLOAD_CONFIG'
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      resolve(reader.result.split(',')[1])
    }

    reader.onerror = (error) => {
      reject(error)
    }

    reader.readAsDataURL(file)
  })
}

export const uploadImageToGitHub = async (file) => {
  const commitMessage = 'Upload image to GitHub'
  try {
    // 读取图片文件内容
    let config = window.localStorage.getItem(UPLOAD_CONFIG) || '{}'
    config = JSON.parse(config)
    if (!config.token || !config.owner || !config.repo) {
      message.error('请完善GitHub配置')
      return ''
    }
    const { token, owner, repo } = config
    const path = generateRandomFileName(file)
    // 构造请求头
    const headers = {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json'
    }
    const imageContent = await fileToBase64(file)
    // 构造请求体
    const requestData = {
      message: commitMessage,
      content: imageContent,
      path: path
    }

    // 发送 HTTP 请求
    const response = await axios.put(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      requestData,
      { headers }
    )

    // 输出上传结果
    console.log('Image uploaded successfully:', response.data)
    return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/${response.data.content.path}`
  } catch (error) {
    console.error('Failed to upload image to GitHub:', error.response.data)
    return ''
  }
}
