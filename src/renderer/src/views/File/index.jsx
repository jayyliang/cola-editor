import React, { useCallback, useEffect, useState } from 'react'
import styles from './index.module.less'
import FileTree from './FileTree'
import { Tabs } from 'antd'
import gfm from '@bytemd/plugin-gfm'
import highlight from '@bytemd/plugin-highlight'
import { Editor } from '@bytemd/react'
import 'bytemd/dist/index.css'
import zh from 'bytemd/locales/zh_Hans.json'
import 'highlight.js/styles/default.css'
import './editor.css'
import { uploadImageToGitHub } from '../../../../utils/upload'
import { GET_FILE, RECEIVE_FILE, UPDATE_FILE } from '../../../../event'
import { debounce } from 'lodash'
const plugins = [gfm(), highlight()]
const File = () => {
  const [tabs, setTabs] = useState([])
  const [activeKey, setActiveKey] = useState('')
  const [value, setValue] = useState('')
  const ipcRenderer = window.electron.ipcRenderer
  const handleSelect = (keys, { node }) => {
    const key = keys[0]
    if (!node.isLeaf) {
      return
    }
    const newTabs = [...tabs]
    const exist = newTabs.find((tab) => tab.key === key)
    if (!exist) {
      newTabs.push({ key, label: node.title })
      setTabs(newTabs)
    }
    setActiveKey(key)
  }

  const onEdit = (targetKey) => {
    const remove = (targetKey) => {
      let newActiveKey = activeKey
      let lastIndex = -1
      tabs.forEach((item, i) => {
        if (item.key === targetKey) {
          lastIndex = i - 1
        }
      })
      const newPanes = tabs.filter((item) => item.key !== targetKey)
      if (newPanes.length && newActiveKey === targetKey) {
        if (lastIndex >= 0) {
          newActiveKey = newPanes[lastIndex].key
        } else {
          newActiveKey = newPanes[0].key
        }
      }
      if (newPanes.length === 0) {
        newActiveKey = ''
      }
      setTabs(newPanes)
      setActiveKey(newActiveKey)
    }
    remove(targetKey)
  }

  useEffect(() => {
    ipcRenderer.on(RECEIVE_FILE, (_, value) => {
      setValue(value)
    })
  }, [])

  useEffect(() => {
    if (!activeKey) {
      return
    }
    ipcRenderer.send(GET_FILE, activeKey)
  }, [activeKey])

  const updateFile = useCallback(
    debounce((value) => {
      ipcRenderer.send(UPDATE_FILE, activeKey, value)
    }, 300),
    [activeKey]
  )

  const handleUpload = async (files) => {
    const urls = await Promise.all(
      files.map(async (file) => {
        const url = await uploadImageToGitHub(file)
        return {
          url
        }
      })
    )
    return urls
  }

  return (
    <div className={styles.container}>
      <FileTree handleSelect={handleSelect} />
      {!!activeKey && (
        <div className={styles.contentWrapper}>
          <div className={styles.tab}>
            <Tabs
              hideAdd
              type="editable-card"
              activeKey={activeKey}
              onChange={(key) => setActiveKey(key)}
              onEdit={onEdit}
              items={tabs}
            />
          </div>
          <div className={styles.editor}>
            <Editor
              uploadImages={handleUpload}
              mode="split"
              locale={zh}
              value={value}
              plugins={plugins}
              onChange={(v) => {
                setValue(v)
                updateFile(v)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default File
