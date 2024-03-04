import styles from './index.module.less'
import { HashRouter as Router } from 'react-router-dom'
import { ConfigProvider, Tabs, Tooltip, message } from 'antd'
import { FileFilled, SettingFilled } from '@ant-design/icons'
import zhCN from 'antd/locale/zh_CN'
import File from './views/File'
import Setting from './views/Setting'
import { COMMON_ERROR, COMMON_ERROR_LOG } from '../../event'
import { useEffect } from 'react'
function App() {
  const ipcRenderer = window.electron.ipcRenderer
  useEffect(() => {
    ipcRenderer.on(COMMON_ERROR, (event, msg) => {
      message.error(msg)
    })
    ipcRenderer.on(COMMON_ERROR_LOG, (_, data) => {
      console.error(data)
    })
  }, [])
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <div className={styles.container}>
          <Tabs
            tabPosition={'left'}
            items={[
              {
                label: (
                  <Tooltip title="资源管理">
                    <FileFilled />
                  </Tooltip>
                ),
                key: 'file',
                children: <File />
              },
              {
                label: (
                  <Tooltip title="设置">
                    <SettingFilled />
                  </Tooltip>
                ),
                key: 'setting',
                children: <Setting />
              }
            ]}
          />
        </div>
      </Router>
    </ConfigProvider>
  )
}

export default App
