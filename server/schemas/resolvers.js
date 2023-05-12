const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        user: async (parent, { _id }) => {
            const params = _id ? { _id } : {};
            return User.findOne(params)
        },
        me: async(parent, args, context) => {
            if (context.user) {
                return User.findOne({ _id: context.user._id})
            }
            throw new AuthenticationError('You need to be logged in!');
        },
    },
    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);
            return { token, user };
        },
        
        login: async (parent, body) => {
            const user = await User.findOne({ email: body.email });
    
            if (!user) {
            throw new AuthenticationError('No user found with this email address');
            }
    
            const correctPw = await user.isCorrectPassword(body.password);
    
            if (!correctPw) {
            throw new AuthenticationError('Incorrect credentials');
            }
    
            const token = signToken(user);
    
            return { token, user };
        },

        saveBook: async(parent, {user, body}) => {
            const updateUser = await User.findOneAndUpdate(
                { _id: user._id },
                { $addToSet: { savedBooks: body } },
                { new: true, runValidators: true }
            );
            return updateUser;
        },

        removeBook: async(parent, {user, params}) => {
            const updateUser = await User.findOneAndUpdate(
                { _id: user._id },
                { $pull: { savedBooks: { bookId: params.bookId } } },
                { new: true }
            );
            return updateUser;
        }
    }

}

module.exports = resolvers;