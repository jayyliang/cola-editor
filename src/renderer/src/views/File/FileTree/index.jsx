import { Button, Input, Modal, message, Dropdown } from 'antd'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ADD_FILE,
  ADD_FOLDER,
  COPY,
  DELETE,
  MOVE,
  OPEN_FILE_DIALOG,
  RENAME,
  SELECTED_DIRECTORY,
  UPDATE_TREE
} from '../../../../../event'
import { Tree } from 'antd'
import styles from './index.module.less'
const { DirectoryTree } = Tree
import { getNonLeafNodesFromArray } from '../../../../../utils/tree'
const FileTree = (props) => {
  const ipcRenderer = window.electron.ipcRenderer
  const [currentPath, setCurrentPath] = useState('')
  const [treeData, setTreeData] = useState([])
  const [selectNode, setSelectNode] = useState('')
  const [targetNode, setTargetNode] = useState('')
  const [title, setTitle] = useState('')
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [action, setAction] = useState('')
  const [copyOrMoveVisible, setCopyOrMoveVisible] = useState(false)
  const folders = useMemo(() => {
    return getNonLeafNodesFromArray(treeData)
  }, [treeData])
  const handleSelectFolder = () => {
    ipcRenderer.send(OPEN_FILE_DIALOG)
  }
  const rightTriggerRef = useRef(null)
  const [rightMenus, setRightMenus] = useState([])

  useEffect(() => {
    if (!addModalVisible) {
      setTitle('')
      setAction('')
    }
  }, [addModalVisible])

  useEffect(() => {
    ipcRenderer.on(SELECTED_DIRECTORY, (event, data) => {
      const { directoryPath, folderTreeData } = data
      if (folderTreeData.length === 0) {
        message.info('文件夹为空，请重新选择')
        return
      }
      setCurrentPath(directoryPath)
      setTreeData(folderTreeData)
    })
  }, [])

  useEffect(() => {
    ipcRenderer.on(UPDATE_TREE, (_, data) => {
      setTreeData(data)
    })
  }, [])

  const handleAddOrRename = () => {
    const path = selectNode.key || currentPath
    ipcRenderer.send(action, path, title, treeData, selectNode)
    setAddModalVisible(false)
  }

  const handleCopyOrMove = () => {
    const path = selectNode.key
    ipcRenderer.send(action, path, targetNode.key, selectNode, treeData)
    setCopyOrMoveVisible(false)
  }

  const handleRightClick = ({ event, node }) => {
    const overlay = rightTriggerRef.current
    const { pageX, pageY } = event
    overlay.style.left = `${pageX}px`
    overlay.style.top = `${pageY}px`
    setSelectNode(node)
    setTimeout(() => {
      // overlay
      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        view: window,
        button: 2, // 2 表示右键
        // 如果需要设置鼠标坐标，可以添加以下属性
        clientX: pageX,
        clientY: pageY
      })
      const handleItemClick = ({ key }) => {
        setAction(key)
        if (key === ADD_FILE || key === ADD_FOLDER || key === RENAME) {
          if (key === RENAME) {
            let title = node.title
            if (node.isLeaf) {
              const index = title.lastIndexOf('.')
              title = title.substring(0, index)
            }
            setTitle(title)
          } else {
            setTitle('')
          }
          setAddModalVisible(true)
        }
        if (key === MOVE || key === COPY) {
          setCopyOrMoveVisible(true)
        }
        if (key === DELETE) {
          Modal.confirm({
            title: '确定要删除吗？',
            onOk: () => {
              ipcRenderer.send(DELETE, node.key, node, treeData)
            }
          })
        }
      }
      const items = []
      if (!node.isLeaf) {
        items.unshift(
          ...[
            {
              label: '创建文件夹',
              key: ADD_FOLDER,
              onClick: handleItemClick
            },
            {
              label: '创建文件',
              key: ADD_FILE,
              onClick: handleItemClick
            }
          ]
        )
      }
      if (node.key !== currentPath) {
        items.push(
          ...[
            {
              label: '删除',
              key: DELETE,
              onClick: handleItemClick
            },
            {
              label: '重命名',
              key: RENAME,
              onClick: handleItemClick
            },
            {
              label: '复制',
              key: COPY,
              onClick: handleItemClick
            },
            {
              label: '移动',
              key: MOVE,
              onClick: handleItemClick
            }
          ]
        )
      }
      setRightMenus(items)
      // 触发右键事件
      overlay.dispatchEvent(event)
    })
  }
  if (!currentPath) {
    return (
      <div className={styles.chooseContainer}>
        <Button onClick={handleSelectFolder} type="primary">
          选择文件夹
        </Button>
      </div>
    )
  }
  return (
    <div className={styles.wrapper}>
      <DirectoryTree
        onSelect={props.handleSelect}
        defaultExpandedKeys={[currentPath]}
        rootClassName={styles.folderTree}
        treeData={treeData}
        onRightClick={handleRightClick}
      />
      <Modal
        onOk={() => {
          handleAddOrRename()
        }}
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
      >
        <Input
          value={title}
          style={{ marginTop: 24 }}
          onInput={(e) => setTitle(e.target.value)}
          placeholder="输入名称"
        />
      </Modal>
      <Modal
        open={copyOrMoveVisible}
        onOk={() => handleCopyOrMove()}
        onCancel={() => setCopyOrMoveVisible(false)}
      >
        <DirectoryTree
          style={{ marginTop: 24 }}
          rootClassName={styles.folderTree}
          onSelect={(_, { node }) => {
            setTargetNode(node)
          }}
          treeData={folders}
        />
      </Modal>
      <Dropdown menu={{ items: rightMenus }} trigger={['contextMenu']}>
        <div ref={rightTriggerRef} style={{ position: 'absolute' }}></div>
      </Dropdown>
    </div>
  )
}

export default FileTree
