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
  const [showTooltip, setShowTooltip] = useState(false)

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

    getCurrentUrl().then((url) => {
      setAliasValue(url.toString())
    })
  }, [])

  const getCurrentUrl = () => {
    return new Promise((resolve) => {
      if (chrome?.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const currentTab = tabs[0]
          if (currentTab) {
            const url = new URL(currentTab.url || "")
            resolve(url)
          } else {
            resolve('')
          }
        })
      } else {
        resolve('')
      }
    })
  }

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
      setAddOrUpdate("update")
    } else {
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

  const handleTooltipMouseEnter = () => {
    setShowTooltip(true)
  }

  const handleTooltipMouseLeave = () => {
    setShowTooltip(false)
  }

  return (
    <div className="popup-container">
      <p className="quickLink-title">
        <div className="quickLink-logo"></div>
        QuickLink
      </p>
      {/* 头部表单 */}
      <div className="input-container">
        <div className="input-group">
          <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
            <input
              className="alias-input"
              value={aliasKey}
              onChange={(e) => handleChange(e.target.value)}
            />
            <p className="alias-input-label">别名</p>
            <div
              className="alias-input-tip"
              onMouseEnter={handleTooltipMouseEnter}
              onMouseLeave={handleTooltipMouseLeave}
            >
              ?
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <p className="alias-input-label">目标地址</p>
            <textarea
              className="alias-input alias-input-textarea"
              value={aliasValue}
              onChange={(e) => setAliasValue(e.target.value)}
            />
          </div>

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
      {Object.entries(aliases).length > 0 && (
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
      )}
      {toastMessage && <div className="toast">{toastMessage}</div>}
      {showTooltip && (
        <div className="tooltip">
          <p className="tooltip-title">1、精确匹配模式 </p>
          <p>配置：{`别名task/fat 目标https://aaa.com/task`}</p>
          <table className="tooltip-table">
            <thead>
              <tr>
                <th>搜索栏输入</th>
                <th>跳转地址</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>task/fat</td>
                <td>https://aaa.com/task</td>
              </tr>
            </tbody>
          </table>

          <p className="tooltip-title">2、动态参数模式</p>
          <p>配置：{`别名task/prod 目标https://aaa.com/task/{taskid}`}</p>
          <table className="tooltip-table">
            <thead>
              <tr>
                <th>搜索栏输入</th>
                <th>跳转地址</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>task/prod</td>
                <td>https://aaa.com/task</td>
              </tr>
              <tr>
                <td>task/prod?taskid=111</td>
                <td>https://aaa.com/task/111</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default IndexPopup
