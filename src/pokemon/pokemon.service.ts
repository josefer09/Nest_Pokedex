import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';

@Injectable()
export class PokemonService {
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
  ) {}

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();

    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findAll() {
    try {
      const pokemons = await this.pokemonModel.find();
      return pokemons;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findOne(term: string) {
    let pokemonExist: Pokemon;
    if (!isNaN(+term)) {
      pokemonExist = await this.pokemonModel.findOne({ no: term });
    }

    if (!pokemonExist && isValidObjectId(term)) {
      pokemonExist = await this.pokemonModel.findById(term);
    }

    if (!pokemonExist) {
      pokemonExist = await this.pokemonModel.findOne({
        name: term.toLowerCase().trim(),
      });
    }

    if (!pokemonExist) {
      throw new NotFoundException(`Pokemon with term ${term} not found`);
    }

    return pokemonExist;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne(term);
    if (updatePokemonDto.name) {
      updatePokemonDto.name = updatePokemonDto.name.toLocaleLowerCase();

      try {
        // Actualiza el pokemon
        const pokemonUpdated = await pokemon.updateOne(updatePokemonDto, {
          new: true,
        });
        return { ...pokemon.toJSON(), ...updatePokemonDto };
      } catch (error) {
        this.handleExceptions(error);
      }
    }
  }

  async remove(id: string) {
    
      // const pokemonExist = await this.findOne(id);
      // await pokemonExist.deleteOne();
      // return pokemonExist;

      const { deletedCount} = await this.pokemonModel.deleteOne({ _id: id });
      if( deletedCount === 0 ) {
        throw new BadRequestException(`Pokemon with id: ${id} not found`);
      }
      return {msg: 'Deleted'};
  }


  private handleExceptions( error: any ) {
    if (error.code === 11000 ) {
      throw new BadRequestException(`Pokemon alredy exist in db ${JSON.stringify( error.keyValue )}`);
    }
    console.log(error);
    throw new InternalServerErrorException(`Can't create Pokemon - Check server logs`);
  }
}