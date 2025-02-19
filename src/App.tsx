/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useRef, useState } from 'react';
import { UserWarning } from './UserWarning';
import { addTodos, deleteTodos, getTodos, USER_ID } from './api/todos';
import { Header } from './components/header';
import { TodoList } from './components/todoList';
import { Footer } from './components/footer';
import { Error } from './components/Error';
import { Todo } from './types/Todo';
import { Filter } from './types/Filter';

export const App: React.FC = () => {
  const newTodoInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [newTodo, setNewTodo] = useState<string>('');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newFilter, setNewFilter] = useState<Filter>(Filter.All);
  const [isActive] = useState<number>();
  const todosLeft = todos.filter(todo => !todo.completed).length;
  const [isLoading, setIsLoading] = useState(false);
  const [todoClear, setTodoClear] = useState<boolean>(false);
  const [isInputDisabled, setIsInputDisabled] = useState(false);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [deletingTodoId, setDeletingTodoId] = useState<number | null>(null);

  const loadTodos = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const todosData = await getTodos();
      const completedTodos = todosData.filter(todo => todo.completed);

      setTodos(todosData);
      setTodoClear(completedTodos.length > 0);
    } catch (error) {
      setErrorMessage('Unable to load todos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTodos().then(() => {
      newTodoInputRef.current?.focus();
    });
  }, []);

  useEffect(() => {
    setTodoClear(todos.some(todo => todo.completed));
    newTodoInputRef.current?.focus();
  }, [todos]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setErrorMessage('');
    }, 3000);

    return () => clearTimeout(timer);
  }, [errorMessage]);

  function deleteTodo(todoId: number) {
    setDeletingTodoId(todoId);
    deleteTodos(todoId)
      .then(() => {
        setIsLoading(true);
        setTodos(currentTodos =>
          currentTodos.filter(todo => todo.id !== todoId),
        );
      })
      .catch(() => setErrorMessage('Unable to delete a todo'))
      .finally(() => {
        setIsLoading(false);
        setDeletingTodoId(null);
      });
  }

  const clearCompletedTodos = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setIsInputDisabled(true);

    try {
      const completedTodos = todos.filter(todo => todo.completed);

      await Promise.all(
        completedTodos.map(todo =>
          deleteTodos(todo.id).catch(() => {
            setErrorMessage('Unable to delete a todo');
          }),
        ),
      );

      const remainingTodos = todos.filter(todo => !todo.completed);

      setTodos(remainingTodos);
      setTodoClear(false);
    } catch (error) {
      setErrorMessage('Unable to clear completed todos');
    } finally {
      setIsInputDisabled(false);
      setIsLoading(false);
    }
  };

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTodo.trim()) {
      setErrorMessage('Title should not be empty');

      return;
    }

    setIsLoading(true);
    setIsInputDisabled(true);

    const tempNewTodo = {
      id: 0,
      userId: USER_ID,
      title: newTodo.trim(),
      completed: false,
    };

    setTempTodo(tempNewTodo);

    try {
      const addedTodo = await addTodos(tempNewTodo);

      setTodos(prevTodos => [...prevTodos, addedTodo]);
      setTempTodo(null);
      setNewTodo('');
    } catch (error) {
      setTempTodo(null);
      setErrorMessage('Unable to add a todo');
    } finally {
      setIsLoading(false);
      setIsInputDisabled(false);
      newTodoInputRef.current?.focus();
    }
  };

  const filteredTodos = todos.filter(todo => {
    if (newFilter === Filter.All) {
      return true;
    }

    if (newFilter === Filter.Active) {
      return !todo.completed;
    }

    if (newFilter === Filter.Completed) {
      return todo.completed;
    }

    return true;
  });

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>
      <Header
        isInputDisabled={isInputDisabled}
        handleSubmit={onAdd}
        newTodoInputRef={newTodoInputRef}
        newTodo={newTodo}
        setNewTodo={setNewTodo}
      />

      {todos.length > 0 && (
        <TodoList
          deletingTodoId={deletingTodoId}
          tempTodo={tempTodo}
          deleteTodo={deleteTodo}
          filteredTodos={filteredTodos}
          isActive={isActive}
          isLoading={isLoading}
        />
      )}

      {todos.length > 0 && (
        <Footer
          todoClear={todoClear}
          newFilter={newFilter}
          setNewFilter={setNewFilter}
          todosLeft={todosLeft}
          clearCompletedTodos={clearCompletedTodos}
        />
      )}
      <Error errorMessage={errorMessage} setErrorMessage={setErrorMessage} />
    </div>
  );
};
