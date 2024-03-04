// 给定一个父节点 key，在父节点下增加子节点
export const addChildNode = (treeData, parentKey, newNode) => {
  const parentNode = findNodeByKey(treeData, parentKey)
  if (parentNode) {
    parentNode.children.push(newNode)
  } else {
    console.error('Parent node with key', parentKey, 'not found.')
  }
}

// 给定一个节点 key 删除该节点
export const deleteNodeByKey = (treeData, nodeKey) => {
  // 遍历树
  for (let i = 0; i < treeData.length; i++) {
    const node = treeData[i]
    if (node.key === nodeKey) {
      // 如果当前节点是要删除的节点，直接从树的数组中删除该节点
      treeData.splice(i, 1)
      // 删除成功后退出函数
      return
    }
    if (node.children) {
      // 如果当前节点有子节点，递归删除
      deleteNodeByKey(node.children, nodeKey)
    }
  }
}

// 给定一个节点 key 找到该节点
export const findNodeByKey = (nodes, key) => {
  for (let node of nodes) {
    if (node.key === key) {
      return node
    }
    if (node.children) {
      const foundNode = findNodeByKey(node.children, key)
      if (foundNode) {
        return foundNode
      }
    }
  }
  return null
}

export const updateNodeValue = (treeData, nodeKey, nodeLabel, newValue) => {
  const node = findNodeByKey(treeData, nodeKey)
  if (node) {
    node[nodeLabel] = newValue
  } else {
    console.error('Node with key', nodeKey, 'not found.')
  }
}

export const getNonLeafNodesFromArray = (treeData) => {
  const nonLeafNodes = []

  treeData.forEach((tree) => {
    if (tree.children && tree.children.length > 0) {
      // 如果有子节点，则将当前节点加入新树，并递归获取非叶子节点
      nonLeafNodes.push({
        ...tree,
        children: getNonLeafNodesFromArray(tree.children)
      })
    }
  })

  return nonLeafNodes.length > 0 ? nonLeafNodes : []
}

export const dfs = (tree, cb) => {
  tree.forEach((node) => {
    cb(node)
    if (node.children) {
      dfs(node.children, cb)
    }
  })
}
