1. keystore 생성 
keytool -genkey -v -keystore release-phopl.jks -alias phopl -keyalg RSA -keysize 2048 -validity 30000

2. 생성된 키를 android root 폴더로 복사 

3. 같은 폴더에 release-signing.properties 파일 생성 후, 아래 정보 생성 
storeFile=release-phopl.jks
keyAlias=phopl
storePassword=vhvmf!@#$
keyPassword=vhvmf!@#$