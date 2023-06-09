const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'Please tell us your name'],
	},
	email: {
		type: String,
		required: [true, 'Please provide your email'],
		unique: true,
		lowercase: true,
		validate: [validator.isEmail, 'Please provide a valid email'],
	},
	password: {
		type: String,
		required: [true, 'Please provide a password'],
		minlength: 8,
		select: false,
	},
	passwordConfirm: {
		type: String,
		required: [true, 'Please confirm your password'],
		validate: {
			validator: function (el) {
				return el === this.password;
			},
			message: 'Passwords are not the same!',
		},
	},
	phone: {
		type: String,
	},
	places: {
		type: String,
	},
	kind: {
		type: String,
		required: [true, 'An user must have a kind'],
		enum: {
			values: ['backOffice', 'janitor', 'collector'],
			message: 'Kind is either: backOffice, janitor, collector',
		},
		default: 'backOffice',
	},
	createdAt: {
		type: Date,
		default: Date.now(),
	},
});

userSchema.pre('save', async function (next) {
	//Only run this function if password was actually modified
	if (!this.isModified('password')) return next();
	//Hash the password with cost of 12
	this.password = await bcrypt.hash(this.password, 12);

	//Delete passwordConfirm field
	this.passwordConfirm = undefined;
	next();
});

userSchema.methods.correctPassword = async function (
	candidatePassword,
	userPassword
) {
	return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
	if (this.passwordChangeAt) {
		// getTime return millisecond
		const changedTimestamp = parseInt(
			this.passwordChangeAt.getTime() / 1000,
			10
		);
		return JWTTimestamp < changedTimestamp;
	}
	// False means not change
	return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
