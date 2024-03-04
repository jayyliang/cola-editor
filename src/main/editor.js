import { ipcMain } from 'electron'
import { COMMON_ERROR, COMMON_ERROR_LOG, GET_FILE, RECEIVE_FILE, UPDATE_FILE } from '../event'
import fs from 'fs'
export default () => {
  ipcMain.on(GET_FILE, (event, key) => {
    try {
      const res = fs.readFileSync(key, { encoding: 'utf8' })
      event.sender.send(RECEIVE_FILE, res)
    } catch (error) {
      event.sender.send(COMMON_ERROR, '读取文件失败')
      event.sender.send(COMMON_ERROR_LOG, error)
    }
  })
  ipcMain.on(UPDATE_FILE, (event, key, value) => {
    try {
      console.log('更新文件内容')
      fs.writeFileSync(key, value, { encoding: 'utf8' })
    } catch (error) {
      event.sender.send(COMMON_ERROR, '更新文件失败')
      event.sender.send(COMMON_ERROR_LOG, error)
    }
  })
}
