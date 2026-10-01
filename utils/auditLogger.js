const AuditLog=require('../models/AuditLog');

const logAdminAction=async({adminId, action, targetId, targetModel, details, req})=>{
    try{
        await AuditLog.create({
            admin:adminId,
            action,
            targetId,
            targetModel,
            details,
            ipAddress: req?.ip || 'unknown',
        })
    }catch(err){
        console.error('Failed to write audit log:',err.message)
    }
}

module.exports=logAdminAction;
