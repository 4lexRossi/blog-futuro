import React, { useEffect, useState, useMemo } from 'react';
import api from '../../services/api';
import moment from 'moment';
import { Button, ButtonGroup, Alert, Dropdown, DropdownItem, DropdownToggle, DropdownMenu, Pagination, PaginationItem, PaginationLink } from 'reactstrap';
import socketio from 'socket.io-client';

import './dashboard.css'

export default function Dashboard({ history }) {
  const [events, setEvents] = useState([]);
  const user = localStorage.getItem('user');
  const user_id = localStorage.getItem('user_id');
  const [rSelected, setRSelected] = useState(null);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [messageHandler, setMessageHandler] = useState('');
  const [eventsRequests, setEventsRequests] = useState([]);
  const [dropDownOpen, setDropDownOpen] = useState(false);
  const [eventRequestMessage, setEventRequestMessage] = useState('')
  const [eventRequestSuccess, setEventRequestSuccess] = useState(false)


  const toggle = () => setDropDownOpen(!dropDownOpen)

  useEffect(() => {
    getEvents()
  }, [])

  const socket = useMemo(
    () =>
      socketio('http://localhost:8000/', { query: { user: user_id } }),
    [user_id]
  );

  useEffect(() => {
    socket.on('registration_request', data => (setEventsRequests([...eventsRequests, data])))
  }, [eventsRequests, socket])

  const filterHandler = (query) => {
    setRSelected(query)
    getEvents(query)
  }

  const myEventsHandler = async () => {
    try {
      setRSelected('myevents')
      const response = await api.get('/user/events', { headers: { user: user } })
      setEvents(response.data.events)
    } catch (error) {
      history.push('/login');
    }
  }

  const getEvents = async (filter) => {
    try {
      const url = filter ? `/dashboard/${filter}` : '/dashboard';
      const response = await api.get(url, { headers: { user } })

      setEvents(response.data.events)

    } catch (error) {
      history.push('/login');

    }
  };
  const deleteEventHandler = async (eventId) => {
    try {
      await api.delete(`/event/${eventId}`, { headers: { user } });
      setSuccess(true)
      setMessageHandler('Evento deletado com sucesso!')
      setTimeout(() => {
        setSuccess(false)
        filterHandler(null)
        setMessageHandler('')
      }, 2500)

    } catch (error) {
      setError(true)
      setMessageHandler('Erro ao excluir evento')
      setTimeout(() => {
        setError(false)
        setMessageHandler('')
      }, 2000)

    }
  }



  const registrationRequestHandler = async (event) => {
    try {
      await api.post(`/registration/${event.id}`, {}, { headers: { user } })

      setSuccess(true)
      setMessageHandler(`Coment na postagem ${event.title} com sucesso!`)
      setTimeout(() => {
        setSuccess(false)
        filterHandler(null)
        setMessageHandler('')
      }, 2500)

    } catch (error) {
      setError(true)
      setMessageHandler(`Coment na postagem ${event.title} não foi bem sucedida`)
      setTimeout(() => {
        setError(false)
        setMessageHandler('')
      }, 2000)
    }
  }
  const acceptEventHandler = async (eventId) => {
    try {
      await api.post(`/registration/${eventId}/approvals`, {}, { headers: { user } })

      setEventRequestSuccess(true)
      setEventRequestMessage('Coment na postagem aprovada com sucesso!')
      removeNotificationFromDashboard(eventId)
      setTimeout(() => {
        setEventRequestSuccess(false)
        setEventRequestMessage('')
      }, 2000)

    } catch (err) {
      console.log(err)
    }
  }
  const rejectEventHandler = async (eventId) => {
    try {
      await api.post(`/registration/${eventId}/rejections`, {}, { headers: { user } })

      setEventRequestSuccess(true)
      setEventRequestMessage('Coment na postagem rejeitado com sucesso!')
      removeNotificationFromDashboard(eventId)
      setTimeout(() => {
        setEventRequestSuccess(false)
        setEventRequestMessage('')
      }, 2500)

    } catch (err) {
      console.log(err)
    }
  }

  const removeNotificationFromDashboard = (eventId) => {
    const newEvents = eventsRequests.filter ((event) => event._id !== eventId)
    setEventsRequests(newEvents);
  }

  return (
    <>
      <ul className="notifications">
        {eventsRequests.map(request => {
          return (
            <li key={request._id}>
              <div>
                <strong>{request.user.email}</strong> está pedindo para comentar em sua postagem
                <strong> {request.event.title} </strong>
                <span>Comentário: {request.event.description}</span>
              </div>
              <ButtonGroup>
                <Button color="primary" onClick={() => acceptEventHandler(request._id)}>Aceitar</Button>
                <Button color="danger" onClick={() => rejectEventHandler(request._id)}>Declinar</Button>
              </ButtonGroup>
            </li>
          )
        })}
      </ul>
      {eventRequestSuccess ?<Alert color="success">{eventRequestMessage}</Alert> : ""}
      <div className="filter-panel">
        <Dropdown isOpen={dropDownOpen} toggle={toggle}>
          <DropdownToggle color="primary" caret>
            filter
          </DropdownToggle>
          <DropdownMenu>
            <DropdownItem onClick={() => filterHandler(null)} active={rSelected === null}>Todos os Eventos</DropdownItem>
            <DropdownItem onClick={myEventsHandler} active={rSelected === 'myevents'}>Meus Eventos</DropdownItem>
            <DropdownItem onClick={() => filterHandler('Profissional')} active={rSelected === 'Esportes'}>Profissional</DropdownItem>
            <DropdownItem onClick={() => filterHandler('Social')} active={rSelected === 'Social'}>Social</DropdownItem>
            <DropdownItem onClick={() => filterHandler('Fisico')} active={rSelected === 'Religioso'}>Fisico</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
      <ul className="events-list">
        {events.map(event => (
          <li key={event._id}>
            <header style={{ backgroundImage: `url(${event.thumbnail_url})` }}>
              {event.user === user_id ? <div><Button color="danger" size="sm" onClick={() => deleteEventHandler(event._id)}>Delete</Button></div> : ""}
            </header>
            <span>{event.title}</span>
            <strong className="post"> {event.description}</strong>
            <span>Data: {moment(event.date).format('DD/MM/YYYY')}</span>            
            <Button color="primary" onClick={() => registrationRequestHandler(event)}>Pedir para comentar na postagem</Button>
          </li>
        ))}
      </ul>
      <Pagination size="sm" aria-label="Posts">
          <PaginationItem>
            <PaginationLink first href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink previous href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">
              1
          </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">
              2
          </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">
              3
          </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink next href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink last href="#" />
          </PaginationItem>
        </Pagination>
      {error ? (
        <Alert className="event-validation" color="danger">{messageHandler}</Alert>
      ) : ""}
      {success ? (
        <Alert className="event-validation" color="success">{messageHandler}</Alert>
      ) : ""}
    </>
  )
}