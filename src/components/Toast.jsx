import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

// Lightweight popup notifications (no library). toast(message, type) where
// type is 'error' | 'success' | 'info'. Auto-dismisses.
export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const idRef = useRef(0)

  const toast = useCallback((message, type = 'error') => {
    const id = ++idRef.current
    setItems(list => [...list, { id, message, type }])
    setTimeout(() => setItems(list => list.filter(i => i.id !== id)), 3200)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-wrap">
        {items.map(i => (
          <div key={i.id} className={`toast toast-${i.type}`} onClick={() => setItems(l => l.filter(x => x.id !== i.id))}>
            <span className="toast-ic">{i.type === 'success' ? '✅' : i.type === 'info' ? 'ℹ️' : '⚠️'}</span>
            <span>{i.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
