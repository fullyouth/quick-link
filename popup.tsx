import { useState, useEffect, useRef } from "react"
import "./popup.css"

function IndexPopup() {
  const [aliases, setAliases] = useState<{ [key: string]: { value: string; sort: number } }>({})
  const [aliasKey, setAliasKey] = useState("")
  const [aliasValue, setAliasValue] = useState("")
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [addOrUpdate, setAddOrUpdate] = useState("add")
  const [showExport, setShowExport] = useState(false)
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null)

  // Show toast message
  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 2000)
  }

  // Load aliases from storage on component mount
  useEffect(() => {
    if (chrome?.storage?.sync) {
      chrome.storage.sync.get("aliases", (result) => {
        setAliases(result.aliases || {})
      })
    } else {
      console.error("chrome.storage.sync is not available")
    }
  }, [])

  // Save aliases to storage
  const saveAliases = (newAliases: { [key: string]: { value: string; sort: number } }, cb: () => void) => {
    if (chrome?.storage?.sync) {
      chrome.storage.sync.set({ aliases: newAliases }, () => {
        setAliases(newAliases)
        cb?.()
      })
    } else {
      console.error("chrome.storage.sync is not available")
    }
  }

  const handleChange = (value: string) => {
    setAliasKey(value)
    const alias = aliases[value]
    if (alias) {
      setAliasValue(alias.value)
      setAddOrUpdate("update")
    } else {
      setAliasValue("")
      setAddOrUpdate("add")
    }
  }

  // Add or update an alias
  const handleAddOrUpdate = () => {
    if (aliasKey && aliasValue) {
      const maxSort = Math.max(0, ...Object.values(aliases).map((alias) => alias.sort))
      const newAliases = { ...aliases, [aliasKey]: { value: aliasValue, sort: maxSort + 1 } } // Insert at the beginning
      saveAliases(newAliases, () => {
        showToast(addOrUpdate === "add" ? "添加成功" : "更新成功")
      })
      setAliasKey("")
      setAliasValue("")
    } else {
      showToast("请输入别名和目标地址")
    }
  }

  // Delete an alias
  const handleDelete = (key: string) => {
    const { [key]: _, ...newAliases } = aliases
    saveAliases(newAliases, () => {
      showToast("删除成功")
    })
  }

  // Export aliases as JSON
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(aliases))
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", "aliases.json")
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
    showToast("导出成功")
  }

  // Import aliases from JSON
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedAliases = JSON.parse(e.target?.result as string)
          saveAliases(importedAliases, () => {
            showToast("导入成功")
          })
        } catch (error) {
          showToast("导入失败")
        }
      }
      reader.readAsText(file)
    }
  }

  const handleMouseEnter = () => {
    const timeout = setTimeout(() => setShowExport(true), 3000)
    hoverTimeout.current = timeout
  }

  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout.current)
      hoverTimeout.current = null
    }
  }

  return (
    <div className="popup-container">
      <p className="quickLink-title">
        QuickLink
      </p>
      {/* 头部表单 */}
      <div className="input-container">
        <div className="input-group">
          <input
            className="alias-input"
            placeholder="别名"
            value={aliasKey}
            onChange={(e) => handleChange(e.target.value)}
          />
          <textarea
            className="alias-input alias-input-textarea"
            placeholder="目标地址"
            value={aliasValue}
            onChange={(e) => setAliasValue(e.target.value)}
          />
        </div>
        <div>
          <button className="add-btn" onClick={handleAddOrUpdate} >
            {addOrUpdate === "add" ? "添加" : "更新"}
          </button>
          <div
            className="action-container-wrap"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {
              showExport && (
                <div className="action-container">
                  <div className="action-import">
                    导入
                    <input type="file" accept="application/json" onChange={handleImport} />
                  </div>
                  <button className="action-export" onClick={handleExport}>导出</button>
                </div>
              )
            }
          </div>
        </div>
      </div>
      <ul className="alias-list">
        {Object.entries(aliases)
          .sort(([, a], [, b]) => b.sort - a.sort) // Sort by descending order of sort value
          .map(([key, { value }]) => (
            <li key={key} className="alias-item">
              <p className="alias-item-p1">{key}</p>
              <p className="alias-item-p2">{value}</p>
              <button className="alias-item-btn" onClick={() => handleDelete(key)}>删除</button>
            </li>
          ))}
      </ul>

      {toastMessage && <div className="toast">{toastMessage}</div>}
    </div>
  )
}

export default IndexPopup
