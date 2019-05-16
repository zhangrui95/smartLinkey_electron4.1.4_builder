!macro preInit
    ; This macro is inserted at the beginning of the NSIS .OnInit callback
    ; !system "echo ${INSTALL_REGISTRY_KEY} > ${BUILD_RESOURCES_DIR}/preInit"
    SetRegView 64
    WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "D:\HyLink SmartLinkey"
    WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "D:\HyLink SmartLinkey"
    SetRegView 32
    WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "D:\HyLink SmartLinkey"
    WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "D:\HyLink SmartLinkey"
!macroend

