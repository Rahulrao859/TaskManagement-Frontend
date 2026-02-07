import { useState, useEffect, createContext, useContext } from 'react'
import './index.css'

const API_URL = 'http://localhost:5000/api'

// Auth Context
const AuthContext = createContext(null)

const useAuth = () => useContext(AuthContext)

// Auth Provider Component
function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setUser(data.data)
      } else {
        logout()
      }
    } catch (error) {
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (data.success) {
      localStorage.setItem('token', data.token)
      setToken(data.token)
      setUser(data.user)
      return { success: true }
    }
    return { success: false, message: data.message }
  }

  const register = async (username, email, password) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    })
    const data = await res.json()
    if (data.success) {
      localStorage.setItem('token', data.token)
      setToken(data.token)
      setUser(data.user)
      return { success: true }
    }
    return { success: false, message: data.message }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Login Page
function LoginPage({ onSwitch }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(email, password)
    if (!result.success) {
      setError(result.message || 'Login failed')
    }
    setLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">✓ TaskFlow</div>
          <h1>Welcome Back</h1>
          <p>Sign in to manage your tasks</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{' '}
          <button className="auth-link" onClick={onSwitch}>
            Create one
          </button>
        </p>
      </div>
    </div>
  )
}

// Register Page
function RegisterPage({ onSwitch }) {
  const { register } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await register(username, email, password)
    if (!result.success) {
      setError(result.message || 'Registration failed')
    }
    setLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">✓ TaskFlow</div>
          <h1>Create Account</h1>
          <p>Start organizing your tasks today</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="johndoe"
              required
              minLength={3}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <button className="auth-link" onClick={onSwitch}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}

// Dashboard Component
function Dashboard() {
  const { user, token, logout } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending'
  })

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true)
      const url = filter === 'all'
        ? `${API_URL}/tasks`
        : `${API_URL}/tasks?status=${filter}`
      const res = await fetch(url, { headers: authHeaders })
      const data = await res.json()
      if (data.success) {
        setTasks(data.data)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [filter])

  // Create task
  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        setTasks([data.data, ...tasks])
        resetForm()
      }
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  // Update task
  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_URL}/tasks/${editingTask._id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        setTasks(tasks.map(t => t._id === editingTask._id ? data.data : t))
        resetForm()
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  // Delete task
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return
    try {
      const res = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      })
      const data = await res.json()
      if (data.success) {
        setTasks(tasks.filter(t => t._id !== id))
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  // Quick status update
  const handleStatusChange = async (task, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/tasks/${task._id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ ...task, status: newStatus })
      })
      const data = await res.json()
      if (data.success) {
        setTasks(tasks.map(t => t._id === task._id ? data.data : t))
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  // Open edit modal
  const openEditModal = (task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description,
      status: task.status
    })
    setShowModal(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({ title: '', description: '', status: 'pending' })
    setEditingTask(null)
    setShowModal(false)
  }

  // Calculate stats
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length
  }

  const formatStatus = (status) => {
    return status === 'in-progress' ? 'In Progress' :
      status.charAt(0).toUpperCase() + status.slice(1)
  }

  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <div className="logo">
            <span className="logo-icon">✓</span>
            TaskFlow
          </div>
          <div className="navbar-right">
            <span className="user-greeting">Hello, {user?.username}</span>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              + New Task
            </button>
            <button className="btn btn-secondary" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-container">
        {/* Page Header */}
        <header className="page-header">
          <h1 className="page-title">Task Management</h1>
          <p className="page-subtitle">Organize, track, and complete your tasks efficiently</p>
        </header>

        {/* Stats Bar */}
        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-value total">{stats.total}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-value pending">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-value in-progress">{stats.inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-value completed">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          {['all', 'pending', 'in-progress', 'completed'].map((status) => (
            <button
              key={status}
              className={`filter-btn ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status === 'all' ? 'All Tasks' : formatStatus(status)}
            </button>
          ))}
        </div>

        {/* Task Grid */}
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3 className="empty-state-title">No tasks found</h3>
            <p>Create your first task to get started!</p>
          </div>
        ) : (
          <div className="task-grid">
            {tasks.map((task) => (
              <div key={task._id} className={`card task-card status-${task.status}`}>
                <div className="task-header">
                  <h3 className="task-title">{task.title}</h3>
                </div>
                <p className="task-description">{task.description}</p>
                <div className="task-meta">
                  <select
                    className="form-select"
                    value={task.status}
                    onChange={(e) => handleStatusChange(task, e.target.value)}
                    style={{ padding: '0.5rem', width: 'auto' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <div className="task-actions">
                    <button
                      className="btn btn-icon btn-edit"
                      onClick={() => openEditModal(task)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-icon btn-danger"
                      onClick={() => handleDelete(task._id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => resetForm()}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button className="modal-close" onClick={() => resetForm()}>
                ✕
              </button>
            </div>
            <form className="form" onSubmit={editingTask ? handleUpdate : handleCreate}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter task title"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter task description"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => resetForm()}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Main App Component
function App() {
  const [showRegister, setShowRegister] = useState(false)

  return (
    <AuthProvider>
      <AppContent showRegister={showRegister} setShowRegister={setShowRegister} />
    </AuthProvider>
  )
}

function AppContent({ showRegister, setShowRegister }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return showRegister ? (
      <RegisterPage onSwitch={() => setShowRegister(false)} />
    ) : (
      <LoginPage onSwitch={() => setShowRegister(true)} />
    )
  }

  return <Dashboard />
}

export default App
