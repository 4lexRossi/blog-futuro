const Registration = require('../models/Registration');
const jwt = require('jsonwebtoken');

module.exports = {
  create(req, res){
    jwt.verify(req.token, 'secret', async (err, authData) => {
      if (err) {
        res.sendStatus(401);
      } else {
        
        const user_id = authData.user._id;
        const { eventId } = req.params;
    
        const registration = await Registration.create({
          user: user_id,
          event: eventId          
        })
        
        await registration
          .populate('event')
          .populate('user', '-password')
          .execPopulate();

          registration.owner = registration.event.user
          registration.eventTitle = registration.event.title          
          registration.eventDate = registration.event.date
          registration.userEmail = registration.user.email
          registration.save()

          const ownerSocket = req.connectUsers[registration.event.user]

          if(ownerSocket){
            req.io.to(ownerSocket).emit('registration_request', registration)
          }

        return res.json(registration)
      }
    })
  },
  
  async getRegistration(req, res){
    const { registration_id } = req.params;

    try {
      const registration = await Registration.findById(registration_id)
      await registration
        .populate('event')
        .populate('user', '-password')
        .execPopulate();
      return res.json(registration)
    } catch (error) {
        return res.status(400).json({ message: "Registro não encontrado" })
    }
  },

  getMyRegistrations(req, res){
    jwt.verify(req.token, 'secret', async (err, authData) => {
      if (err) {
        res.sendStatus(401);
      } else {
        try {
          const registrationArr = await Registration.find({ "owner": authData.user._id })
          if (registrationArr){
            return res.json(registrationArr);
          }
        } catch (error) {
          console.log(error)
        }
      }
    })
  }
}