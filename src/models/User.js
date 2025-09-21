import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["estudiante", "docente", "admin"],
      default: "estudiante",
    },
    career: {
      type: String,
      required: function () {
        return this.role === "estudiante";
      },
      trim: true,
    },
    semester: {
      type: Number,
      required: function () {
        return this.role === "estudiante";
      },
      min: [1, "Semester must be at least 1"],
      max: [12, "Semester cannot exceed 12"],
    },
    roleInSemillero: {
      type: String,
      enum: ["miembro", "coordinador", "investigador", "mentor"],
      default: "miembro",
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    socialLinks: {
      github: {
        type: String,
        match: [
          /^https?:\/\/(www\.)?github\.com\/[\w-]+$/,
          "Please enter a valid GitHub URL",
        ],
      },
      linkedin: {
        type: String,
        match: [
          /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+$/,
          "Please enter a valid LinkedIn URL",
        ],
      },
      researchgate: {
        type: String,
        match: [
          /^https?:\/\/(www\.)?researchgate\.net\/profile\/[\w-]+$/,
          "Please enter a valid ResearchGate URL",
        ],
      },
    },
    profileImage: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indices
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Virtual para URL completa de imagen de perfil
userSchema.virtual("profileImageUrl").get(function () {
  return this.profileImage
    ? `${process.env.CLIENT_URL}/uploads/profiles/${this.profileImage}`
    : null;
});

// Middleware para hashear password antes de guardar
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Método para comparar passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para actualizar último login (simplificado)
userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  return await this.save({ validateBeforeSave: false });
};

// Método para obtener datos públicos del usuario (sin password)
userSchema.methods.toPublicJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

// Método para obtener perfil completo (para el usuario autenticado)
userSchema.methods.getFullProfile = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    career: this.career,
    semester: this.semester,
    roleInSemillero: this.roleInSemillero,
    bio: this.bio,
    skills: this.skills,
    socialLinks: this.socialLinks,
    profileImage: this.profileImage,
    profileImageUrl: this.profileImageUrl,
    isActive: this.isActive,
    joinDate: this.joinDate,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Crear índice único para email sin duplicado
userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);

export default User;
