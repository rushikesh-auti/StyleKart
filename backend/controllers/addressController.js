const Address = require("../models/Address");

const getAddressInput = (body) => ({
  fullName: body.fullName?.trim(),
  mobile: body.mobile?.trim(),
  addressLine1: body.addressLine1?.trim(),
  addressLine2: body.addressLine2?.trim() || "",
  city: body.city?.trim(),
  state: body.state?.trim(),
  pinCode: body.pinCode?.trim(),
  addressType: body.addressType || "Home",
});

const validateAddress = (address) => {
  if (
    !address.fullName ||
    !address.mobile ||
    !address.addressLine1 ||
    !address.city ||
    !address.state ||
    !address.pinCode
  ) {
    return "Please complete all required address fields.";
  }

  if (!/^[6-9]\d{9}$/.test(address.mobile)) {
    return "Enter a valid 10-digit mobile number.";
  }

  if (!/^\d{6}$/.test(address.pinCode)) {
    return "Enter a valid 6-digit PIN code.";
  }

  return "";
};

const getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({
      user: req.user.id,
    }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      addresses,
    });
  } catch (error) {
    next(error);
  }
};

const createAddress = async (req, res, next) => {
  try {
    const addressInput = getAddressInput(req.body);
    const validationError = validateAddress(addressInput);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const addressCount = await Address.countDocuments({
      user: req.user.id,
    });

    const shouldBeDefault =
      req.body.isDefault === true || addressCount === 0;

    if (shouldBeDefault) {
      await Address.updateMany(
        { user: req.user.id },
        { isDefault: false },
      );
    }

    const address = await Address.create({
      user: req.user.id,
      ...addressInput,
      isDefault: shouldBeDefault,
    });

    res.status(201).json({
      success: true,
      message: "Address added successfully.",
      address,
    });
  } catch (error) {
    next(error);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const addressInput = getAddressInput(req.body);
    const validationError = validateAddress(addressInput);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    const shouldBeDefault = req.body.isDefault === true;

    if (shouldBeDefault) {
      await Address.updateMany(
        {
          user: req.user.id,
          _id: { $ne: address._id },
        },
        { isDefault: false },
      );
    }

    Object.assign(address, addressInput);

    if (shouldBeDefault) {
      address.isDefault = true;
    }

    await address.save();

    res.status(200).json({
      success: true,
      message: "Address updated successfully.",
      address,
    });
  } catch (error) {
    next(error);
  }
};

const setDefaultAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    await Address.updateMany(
      { user: req.user.id },
      { isDefault: false },
    );

    address.isDefault = true;
    await address.save();

    res.status(200).json({
      success: true,
      message: "Default address updated.",
      address,
    });
  } catch (error) {
    next(error);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    if (address.isDefault) {
      const nextAddress = await Address.findOne({
        user: req.user.id,
      }).sort({ createdAt: -1 });

      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Address deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
};