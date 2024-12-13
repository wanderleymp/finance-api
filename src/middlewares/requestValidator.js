function validateRequest(schema, property) {
    return (req, res, next) => {
        const { error } = schema.validate(req[property]);
        
        if (error) {
            return res.status(400).json({
                status: 'error',
                message: error.details[0].message
            });
        }
        
        next();
    };
}

module.exports = { validateRequest };
