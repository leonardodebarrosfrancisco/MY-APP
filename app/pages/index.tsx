'use client'

import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Trash2, Edit, Plus } from 'lucide-react'
import { toast, useToast } from "@/hooks/use-toast"

type Task = {
  id: number
  title: string
  deadline: string
  deadlineTime: string
  completed: boolean
  completedAt?: Date
  grade?: number
  notes?: string
}

type ProgressData = {
  name: string
  tarefas: number
}

type Statistics = {
  completedTasksPercentage: number
  averageGrade: number
  daysUntilNextExam: number
  overdueActivities: number
}

const initialTasks: Task[] = []
const initialProgressData: ProgressData[] = []
const initialStatistics: Statistics = {
  completedTasksPercentage: 0,
  averageGrade: 0,
  daysUntilNextExam: 0,
  overdueActivities: 0,
}

function Dashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [taskList, setTaskList] = useState<Task[]>(initialTasks)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDeadline, setNewTaskDeadline] = useState('')
  const [newTaskTime, setNewTaskTime] = useState('')
  const [newTaskGrade, setNewTaskGrade] = useState<number | undefined>()
  const [newTaskNotes, setNewTaskNotes] = useState('')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [viewMode, setViewMode] = useState('all')
  const [progressData, setProgressData] = useState<ProgressData[]>(initialProgressData)
  const [statistics, setStatistics] = useState<Statistics>(initialStatistics)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const addTask = () => {
    if (newTaskTitle && newTaskDeadline && newTaskTime) {
      setTaskList([
        ...taskList,
        {
          id: Date.now(),
          title: newTaskTitle,
          deadline: newTaskDeadline,
          deadlineTime: newTaskTime,
          completed: false,
          grade: newTaskGrade,
          notes: newTaskNotes
        }
      ])
      setNewTaskTitle('')
      setNewTaskDeadline('')
      setNewTaskTime('')
      setNewTaskGrade(undefined)
      setNewTaskNotes('')
      updateStatistics()
      updateProgressData()
    }
  }

  const removeTask = (taskId: number) => {
    setTaskList(taskList.filter(task => task.id !== taskId))
    updateStatistics()
    updateProgressData()
  }

  const toggleTask = (taskId: number) => {
    setTaskList(taskList.map(task =>
      task.id === taskId
        ? { ...task, completed: !task.completed, completedAt: !task.completed ? new Date() : undefined }
        : task
    ))
    updateStatistics()
    updateProgressData()
  }

  const updateTask = (updatedTask: Task) => {
    setTaskList(taskList.map(task =>
      task.id === updatedTask.id ? updatedTask : task
    ))
    setEditingTask(null)
    setIsEditModalOpen(false)
    updateStatistics()
    updateProgressData()
  }

  const updateStatistics = () => {
    const completedTasks = taskList.filter(task => task.completed)
    const totalTasks = taskList.length
    const completedTasksPercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0
    const now = new Date()
    const overdueActivities = taskList.filter(task => !task.completed && new Date(`${task.deadline}T${task.deadlineTime}`) < now).length
    const gradesSum = completedTasks.reduce((sum, task) => sum + (task.grade || 0), 0)
    const averageGrade = completedTasks.length > 0 ? gradesSum / completedTasks.length : 0

    setStatistics({
      completedTasksPercentage,
      averageGrade: Number(averageGrade.toFixed(2)),
      daysUntilNextExam: 0, // This would need to be calculated based on actual exam dates
      overdueActivities,
    })
  }

  const updateProgressData = () => {
    const today = new Date()
    const oneWeekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)
    const newProgressData: ProgressData[] = []

    for (let i = 0; i < 7; i++) {
      const date = new Date(oneWeekAgo.getFullYear(), oneWeekAgo.getMonth(), oneWeekAgo.getDate() + i)
      const tasksCompleted = taskList.filter(task => {
        if (!task.completed) return false
        const completionDate = task.completedAt || new Date(task.deadline)
        return completionDate.toDateString() === date.toDateString()
      }).length
      newProgressData.push({
        name: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        tarefas: tasksCompleted
      })
    }

    setProgressData(newProgressData)
  }

  const filteredTasks = taskList.filter(task => {
    const now = new Date()
    const taskDeadline = new Date(`${task.deadline}T${task.deadlineTime}`)
    const isOverdue = !task.completed && taskDeadline < now

    if (viewMode === 'completed') return task.completed
    if (viewMode === 'pending') return !task.completed
    if (viewMode === 'overdue') return isOverdue
    return true
  })

  useEffect(() => {
    updateStatistics()
    updateProgressData()
  }, [taskList])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      taskList.forEach(task => {
        if (!task.completed) {
          const taskDeadline = new Date(`${task.deadline}T${task.deadlineTime}`)
          if (taskDeadline <= now) {
            toast({
              title: "Prazo Ultrapassado",
              description: `A tarefa "${task.title}" ultrapassou o prazo!`,
              variant: "destructive",
            })
          }
        }
      })
    }, 60000) // Verifica a cada minuto

    return () => clearInterval(interval)
  }, [taskList])

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Dashboard AcadManage</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Tarefas</CardTitle>
            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Visualizar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="overdue">Atrasadas</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <Input
                  placeholder="Nova tarefa"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
                <div className="flex space-x-2">
                  <Input
                    type="date"
                    value={newTaskDeadline}
                    onChange={(e) => setNewTaskDeadline(e.target.value)}
                  />
                  <Input
                    type="time"
                    value={newTaskTime}
                    onChange={(e) => setNewTaskTime(e.target.value)}
                  />
                </div>
                <Input
                  type="number"
                  placeholder="Nota (opcional)"
                  value={newTaskGrade || ''}
                  onChange={(e) => setNewTaskGrade(e.target.value ? Number(e.target.value) : undefined)}
                />
                <Button onClick={addTask}><Plus className= "h-4 w-4 mr-2" /> Adicionar Tarefa</Button>
              </div>
              <ul className="space-y-2">
                {filteredTasks.map(task => (
                  <li key={task.id} className="flex items-center justify-between space-x-2 bg-secondary p-2 rounded-md">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`task-${task.id}`}
                        checked={task.completed}
                        onCheckedChange={() => toggleTask(task.id)}
                      />
                      <div>
                        <Label
                          htmlFor={`task-${task.id}`}
                          className={`text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                        >
                          {task.title}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {task.deadline} {task.deadlineTime}
                          {task.grade !== undefined && ` | Nota: ${task.grade}`}
                        </p>
                        {task.notes && <p className="text-xs mt-1">{task.notes}</p>}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setEditingTask(task)
                              setIsEditModalOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Editar Tarefa</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-title" className="text-right">
                                Título
                              </Label>
                              <Input
                                id="edit-title"
                                value={editingTask?.title}
                                onChange={(e) => setEditingTask(prev => prev ? {...prev, title: e.target.value} : null)}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-deadline" className="text-right">
                                Data
                              </Label>
                              <Input
                                id="edit-deadline"
                                type="date"
                                value={editingTask?.deadline}
                                onChange={(e) => setEditingTask(prev => prev ? {...prev, deadline: e.target.value} : null)}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-deadline-time" className="text-right">
                                Hora
                              </Label>
                              <Input
                                id="edit-deadline-time"
                                type="time"
                                value={editingTask?.deadlineTime}
                                onChange={(e) => setEditingTask(prev => prev ? {...prev, deadlineTime: e.target.value} : null)}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-grade" className="text-right">
                                Nota
                              </Label>
                              <Input
                                id="edit-grade"
                                type="number"
                                value={editingTask?.grade || ''}
                                onChange={(e) => setEditingTask(prev => prev ? {...prev, grade: e.target.value ? Number(e.target.value) : undefined} : null)}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-notes" className="text-right">
                                Notas
                              </Label>
                              <Textarea
                                id="edit-notes"
                                value={editingTask?.notes}
                                onChange={(e) => setEditingTask(prev => prev ? {...prev, notes: e.target.value} : null)}
                                className="col-span-3"
                              />
                            </div>
                          </div>
                          <Button onClick={() => editingTask && updateTask(editingTask)}>
                            Salvar Alterações
                          </Button>
                        </DialogContent>
                      </Dialog>
                      <Button variant="outline" size="icon" onClick={() => removeTask(task.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Progresso Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tarefas" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{statistics.completedTasksPercentage}%</p>
                <p className="text-sm text-gray-500">Tarefas Concluídas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{statistics.averageGrade}</p>
                <p className="text-sm text-gray-500">Média de Notas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{statistics.daysUntilNextExam}</p>
                <p className="text-sm text-gray-500">Dias até a Próxima Prova</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{statistics.overdueActivities}</p>
                <p className="text-sm text-gray-500">Atividades Atrasadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard;