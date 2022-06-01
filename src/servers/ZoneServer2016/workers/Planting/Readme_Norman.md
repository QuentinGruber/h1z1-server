######2022年03月15日22:45:46
####Hi i'm norman
#####I will write on this file what i do and what i think and what help i need etc.

######2022-03-16 14:35:59
######There is what about I remembered planting in the game;
###**User/Character Grow plants TimeLine**

- Open up land/Wasteland utilization

	- Right click planting tool(Ground Tiller)
	- Click 'Dig'
	- Select target(it will be reclaimed a land for planting with 4 holes)

	  一个工具只能挖一个地方 也就是4个坑

- Planting

	- Right click seed
	- Click 'Place'
	- Select target

- Waiting for crops to grow

	- Fertilize crops

		- Move close to target
		- Right click the  fertilizer
		- Click 'Use', then the lands for planting will show you a  hill(2~4 hole per time)

	- Uproot crops

		- Move your mouse to point to the un mature crops. it will show you 'Take xxx seeds'
		- Type 'E' to take the seeds out

- Picking mature crops

	- Move to target
	- Move mouse to point to the mature crops
	- Press 'E' to take the mature crops(it will be 1~5 random count crops you'll got and if your backpack doesn't have enough space, its will fall to the ground)

######I think the client will support some actions like the blow:
### Actions

- Reclaim

  开垦土地或可种植的区域准备种植

	- on ground

		- InParameters

			- Client
			- Character
			- WorldCoordinates
			- SurfacePlane(if client can send me)

		- Return

	- in water

		- InParameters

			- Client
			- Character
			- WorldCoordinates
			- SurfacePlane(if client can send me)

		- Return

	- on basement

		- way1

			- InParameters

				- client
				- Character
				- WorldCoordinates(if client can send me)
				- SurfacePlane(if client can send me)

			- Return

		- way2

			- InParameters

				- client
				- Character
				- WorldCoordinates
				- SurfacePlane(if client can send me)

			- Return

- SowingSeed

  播种种子

	- InParameters

		- Client
		- Character
		- Hole(target)
		- Seed

	- Return

- FertilizeCrops

  为农作物施肥

	- InParameters

		- Client
		- Character
		- (Character)WorldCoordinates

		  因为施肥是站在农作物右键使用化肥来进行,所以只需要给定人物的世界坐标即可对周围范围内的土地施肥

		- FertilizerObject

	- Return

- UprootCrops

  连根拔起农作物/铲除他们

	- InParameters

		- Client
		- Character
		- Hole

	- Return

- PickingCrops

  采摘已经成熟的果实

	- InParameters

		- Client
		- Character
		- CropsPile(Target)

	- Return
	
	

######Now I will think about the frame that will include the manager and data object.
######The server will include 2 Managers and some ObjectModules right now.
######It's like the blow:
### FarmlandManager

关于种植的一些方面在这里管理.比如
开辟土地
告知世界
应答世界上每个人的眼睛

在实验室的工程师们需要试管时,为他们颁发试管

### GrowingManager

关于农作物成长和生长周期一些功能的管理,可以把他理解为 农作物发生器.比如:
制作受精卵(需要精子,需要试管,需要知道为谁而做)
让他发育
给他打针(促生长素,化肥)
让他成熟
让他老去
让他被主人或者其他的人采摘
将他从试管中移除(可以人为,也可以在作物死去后的固定时间移除)

告诉实验室(房东)植物的状况

### ObjectsModal

- Furrow2

  农田,可以播种的一块土地(但在H1Z1中,他是以一个一个的小方块展示的,所以我们其实应该叫他:土堆
  所以我从Farmland改变为LandForPlanting
  之前我写了Farmland并且写了Hole/Other target which can plant 
  但是我想他们实际上可以精简并且本来就是这样.
  在游戏中的土地,本身就是一块一块的,而不是一个农场里面有多块土地
  后来,我又把LandForPlanting 改为 Furrow为垄沟的意思,原因是我在youtube上查到了关于种植的视频,看到可种植的地方显示为垄沟而不是一个小土包或者一块方形的土地

	- ID
	- Owner
	- WorldCoordinates
	- SurfacePlane
	- CreateTime
	- ExpirationTime
	- State

		- Disposed

- Hole

	- ID
	- Owner
	- ParentFurrow2
	- IndexOfFurrow2
	- FertilizerAreEffective
	- CreateTime
	- State

		- Empty
		- HasSeed

			- HasCornSeed
			- HasWheatSeed

		- Disposed

- Seed

	- ID
	- Owner/Character
	- Name

		- Corn Seed
		- Wheat Seed

	- HoleId

	  种子用在了哪个小坑里面

- Fertilizer

	- ID
	- Owner
	- UsedForHolesIdList

	  用到了哪些坑上面

- Planting tool

	- Id
	- Owner
	- Name

		- Ground Tiller

		  用于在基地上,土地上,水里,开发可以种植的土地

	- Durability

- CropsPile

  当种子种下来的时候,就决定了他的最终生长数量.
  但是他的状态是没有成熟的,只有成熟的果子才可以采摘.
  每一次进行采摘,都会对该表中保存的农作物的剩余数量--;
  同时,农作物可以根据本表的状态来判断农作物的显示模型和剩余时间.

	- Id
	- SeedId
	- Furrow2Id
	- State

		- Baby
		- Toddler
		- Teenager
		- Mature
		- Aging
		- Corpse

	- CurrentNameAndState

		- Such lick [Growing Corn]

	- FertilizerEffectiveRemainingTime

	  化肥能效还剩余多少时间

	- MatureCropsRemainingCount
	- NextState
	- NextStateRemainingTime
	
	
	
	
	



######If that case, there maybe a PlantingManager to be a bridge between Client side and Server side.
## PlantingManager

### Data'sModal

- ClientInformation

	- Character
	- Client

- StateOfFurrow2

	- Client
	- Furrow2

- StateOfHoles

	- Client
	- Furrow2
	- Holes

- StateOfGrowingOfCrops

	- Client
	- Furrow2
	- Holes
	- CropsPile
######The other partner done the UPD server layer and Data translation layer.
######So I just need to thinking about App layer of the PlantingManager .
######We have not cooperated yet, and we still need to determine the format and content of the agreement.
######The contents of the documentation here are just my immature thoughts


