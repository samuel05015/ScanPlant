FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["ScanPlantAPI/ScanPlantAPI/ScanPlantAPI.csproj", "ScanPlantAPI/ScanPlantAPI/"]
RUN dotnet restore "ScanPlantAPI/ScanPlantAPI/ScanPlantAPI.csproj"

COPY . .
WORKDIR "/src/ScanPlantAPI/ScanPlantAPI"
RUN dotnet publish "ScanPlantAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "dotnet ScanPlantAPI.dll --urls http://0.0.0.0:${PORT:-8080}"]
